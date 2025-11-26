// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package gitreposcanner

import (
	"fmt"
	"log"
	"time"

	gitlab "gitlab.com/gitlab-org/api/client-go"
	"golang.org/x/oauth2"
)

const GitLab GitType = "GitLab"

// GitLabScanner implements the GitRepoScanner interface for GitLab repositories
type GitLabRepoScanner struct {
	BaseScanner
	url                    string
	accessToken            string
	group                  *int
	ignoredGroups          map[int]bool
	ignoreRepos            map[int]bool
	obeyRateLimit          bool
	annotateLatestCommitID bool
	client                 *gitlab.Client
	logger                 *log.Logger
}

func NewGitLabScanner(
	url string,
	accessToken string,
	group *int,
	ignoredGroups []int,
	ignoreRepos []int,
	obeyRateLimit bool,
	annotateLatestCommitID bool,
	logger *log.Logger,
) (*GitLabRepoScanner, error) {
	if url == "" {
		return nil, fmt.Errorf("URL required for GitLab connection")
	}
	if accessToken == "" {
		return nil, fmt.Errorf("access token required for GitLab authentication")
	}

	ignoredGroupsMap := make(map[int]bool)
	for _, id := range ignoredGroups {
		ignoredGroupsMap[id] = true
	}

	ignoreReposMap := make(map[int]bool)
	for _, id := range ignoreRepos {
		ignoreReposMap[id] = true
	}

	if logger == nil {
		logger = log.New(log.Writer(), "git_repo_scanner: ", log.LstdFlags)
	}

	return &GitLabRepoScanner{
		url:                    url,
		accessToken:            accessToken,
		group:                  group,
		ignoredGroups:          ignoredGroupsMap,
		ignoreRepos:            ignoreReposMap,
		obeyRateLimit:          obeyRateLimit,
		annotateLatestCommitID: annotateLatestCommitID,
		logger:                 logger,
	}, nil
}

func (g *GitLabRepoScanner) GitType() GitType {
	return GitLab
}

func (g *GitLabRepoScanner) Process(startTime, endTime *time.Time) ([]Finding, error) {
	if err := g.authenticate(); err != nil {
		return nil, fmt.Errorf("failed to authenticate: %w", err)
	}

	projects, err := g.getProjects(startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to get projects: %w", err)
	}

	return g.processProjects(projects)
}

func (g *GitLabRepoScanner) authenticate() error {
	g.logger.Println("Start GitLab authentication")

	var err error
	// Try private token authentication first
	g.client, err = gitlab.NewClient(g.accessToken, gitlab.WithBaseURL(g.url))
	if err != nil {
		return fmt.Errorf("failed to create GitLab client: %w", err)
	}

	// Test authentication by getting current user
	_, _, err = g.client.Users.CurrentUser()
	if err != nil {
		// Try OAuth token if private token fails
		ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: g.accessToken})
		g.client, err = gitlab.NewAuthSourceClient(gitlab.OAuthTokenSource{TokenSource: ts}, gitlab.WithBaseURL(g.url))
		if err != nil {
			return fmt.Errorf("failed to create GitLab OAuth client: %w", err)
		}

		// Test OAuth authentication
		_, _, err = g.client.Users.CurrentUser()
		if err != nil {
			return fmt.Errorf("GitLab authentication failed: %w", err)
		}
	}

	g.logger.Println("GitLab authentication succeeded")
	return nil
}

func (g *GitLabRepoScanner) getProjects(startTime, endTime *time.Time) ([]*gitlab.Project, error) {
	g.logger.Printf("Get GitLab repositories with last activity between %v and %v", startTime, endTime)

	var allProjects []*gitlab.Project

	listOptions := &gitlab.ListProjectsOptions{
		OrderBy: gitlab.Ptr("last_activity_at"),
		Sort:    gitlab.Ptr("desc"),
		ListOptions: gitlab.ListOptions{
			PerPage: 100,
		},
	}

	if startTime != nil {
		listOptions.LastActivityAfter = startTime
	}
	if endTime != nil {
		listOptions.LastActivityBefore = endTime
	}

	if g.group != nil {
		groupOptions := &gitlab.ListGroupProjectsOptions{
			OrderBy:          listOptions.OrderBy,
			Sort:             listOptions.Sort,
			IncludeSubGroups: gitlab.Ptr(true),
			ListOptions:      listOptions.ListOptions,
		}

		// Paginate through all group projects
		for {
			projects, resp, err := g.client.Groups.ListGroupProjects(*g.group, groupOptions)
			if err != nil {
				return nil, fmt.Errorf("failed to list group projects: %w", err)
			}

			allProjects = append(allProjects, projects...)

			if resp.NextPage == 0 {
				break
			}
			groupOptions.Page = resp.NextPage

			if g.obeyRateLimit {
				g.respectRateLimit(resp)
			}
		}
	} else {
		// List all projects accessible to the user
		for {
			projects, resp, err := g.client.Projects.ListProjects(listOptions)
			if err != nil {
				return nil, fmt.Errorf("failed to list projects: %w", err)
			}

			allProjects = append(allProjects, projects...)

			if resp.NextPage == 0 {
				break
			}
			listOptions.Page = resp.NextPage

			if g.obeyRateLimit {
				g.respectRateLimit(resp)
			}
		}
	}

	return allProjects, nil
}

func (g *GitLabRepoScanner) respectRateLimit(resp *gitlab.Response) {
	if !g.obeyRateLimit || resp == nil {
		return
	}

	// GitLab provides rate limit info in headers
	remaining := resp.Header.Get("RateLimit-Remaining")
	reset := resp.Header.Get("RateLimit-Reset")

	if remaining != "" && reset != "" {
		g.logger.Printf("Rate limit - Remaining: %s, Reset: %s", remaining, reset)

		var remainingInt int
		fmt.Sscanf(remaining, "%d", &remainingInt)
		if remainingInt < 10 {
			time.Sleep(time.Second)
		}
	}
}

func (g *GitLabRepoScanner) processProjects(projects []*gitlab.Project) ([]Finding, error) {
	projectCount := len(projects)
	findings := make([]Finding, 0, projectCount)

	for i, project := range projects {
		if !g.isNotIgnored(project) {
			continue
		}

		finding, err := g.createFindingFromProject(project, i, projectCount)
		if err != nil {
			g.logger.Printf("Warning: failed to create finding for project %s: %v",
				project.Name, err)
			continue
		}

		findings = append(findings, finding)
	}

	return findings, nil
}

func (g *GitLabRepoScanner) isNotIgnored(project *gitlab.Project) bool {
	if g.ignoreRepos[project.ID] {
		return false
	}

	if project.Namespace != nil && project.Namespace.Kind == "group" {
		if g.ignoredGroups[project.Namespace.ID] {
			return false
		}
	}

	return true
}

func (g *GitLabRepoScanner) createFindingFromProject(
	project *gitlab.Project,
	index int,
	total int,
) (Finding, error) {
	g.logger.Printf("(%d/%d) Add finding for repo %s with last activity at %s",
		index+1, total, project.Name, project.LastActivityAt.String())

	var latestCommitID *string

	if g.annotateLatestCommitID {
		// Get the latest commit
		commits, _, err := g.client.Commits.ListCommits(project.ID, &gitlab.ListCommitsOptions{
			ListOptions: gitlab.ListOptions{
				PerPage: 1,
				Page:    1,
			},
		})

		if err != nil || len(commits) == 0 {
			g.logger.Printf("Warning: Could not identify the latest commit ID - repository without commits?")
			empty := ""
			latestCommitID = &empty
		} else {
			latestCommitID = &commits[0].ID
		}
	}

	// Determine owner info from namespace
	ownerType := ""
	ownerID := ""
	ownerName := ""
	if project.Namespace != nil {
		ownerType = project.Namespace.Kind
		ownerID = fmt.Sprintf("%d", project.Namespace.ID)
		ownerName = project.Namespace.Name
	}

	createdAt := ""
	if project.CreatedAt != nil {
		createdAt = project.CreatedAt.Format("2006-01-02T15:04:05Z")
	}

	lastActivityAt := ""
	if project.LastActivityAt != nil {
		lastActivityAt = project.LastActivityAt.Format("2006-01-02T15:04:05Z")
	}

	topics := []string{}
	if project.Topics != nil {
		topics = project.Topics
	}

	return g.CreateFinding(
		g.GitType(),
		fmt.Sprintf("%d", project.ID),
		project.WebURL,
		project.PathWithNamespace,
		ownerType,
		ownerID,
		ownerName,
		createdAt,
		lastActivityAt,
		string(project.Visibility),
		project.Archived,
		topics,
		latestCommitID,
	), nil
}
