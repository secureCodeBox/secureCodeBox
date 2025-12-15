// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package gitreposcanner

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/go-github/v79/github"
	"golang.org/x/oauth2"
)

const GitHub GitType = "GitHub"

// GitHubRepoScanner implements the GitRepoScanner interface for GitHub repositories
type GitHubRepoScanner struct {
	BaseScanner
	url                    string
	accessToken            string
	organization           string
	ignoreRepos            map[int64]bool
	obeyRateLimit          bool
	annotateLatestCommitID bool
	client                 *github.Client
	logger                 *log.Logger
	ctx                    context.Context
	lastRateLimitCheck     time.Time
	requestsSinceCheck     int
}

func NewGitHubScanner(
	url string,
	accessToken string,
	organization string,
	ignoreRepos []int64,
	obeyRateLimit bool,
	annotateLatestCommitID bool,
	logger *log.Logger,
) (*GitHubRepoScanner, error) {
	if organization == "" {
		return nil, fmt.Errorf("organization required for GitHub connection")
	}
	if url != "" && accessToken == "" {
		return nil, fmt.Errorf("access token required for GitHub connection")
	}

	ignoreMap := make(map[int64]bool)
	for _, id := range ignoreRepos {
		ignoreMap[id] = true
	}

	if logger == nil {
		logger = log.New(log.Writer(), "git_repo_scanner: ", log.LstdFlags)
	}

	return &GitHubRepoScanner{
		url:                    url,
		accessToken:            accessToken,
		organization:           organization,
		ignoreRepos:            ignoreMap,
		obeyRateLimit:          obeyRateLimit,
		annotateLatestCommitID: annotateLatestCommitID,
		logger:                 logger,
		ctx:                    context.Background(),
		lastRateLimitCheck:     time.Time{},
		requestsSinceCheck:     0,
	}, nil
}

func (g *GitHubRepoScanner) GitType() GitType {
	return GitHub
}

func (g *GitHubRepoScanner) Process(startTime, endTime *time.Time) ([]Finding, error) {
	if err := g.setup(); err != nil {
		return nil, fmt.Errorf("failed to setup GitHub client: %w", err)
	}

	findings, err := g.processRepos(startTime, endTime)

	// Log remaining API calls at the end
	if g.obeyRateLimit {
		rate, _, rateLimitErr := g.client.RateLimit.Get(g.ctx)
		if rateLimitErr == nil {
			core := rate.GetCore()
			g.logger.Printf("Scan complete. Rate limit status: %d/%d remaining, resets at %s",
				core.Remaining, core.Limit, core.Reset.Time.Format(time.RFC3339))
		}
	}

	return findings, err
}

func (g *GitHubRepoScanner) setup() error {
	if g.url != "" {
		return g.setupWithURL()
	}
	return g.setupWithoutURL()
}

func (g *GitHubRepoScanner) setupWithoutURL() error {
	if g.accessToken != "" {
		tc := g.createTokenClient()
		g.client = github.NewClient(tc)
	} else {
		g.client = github.NewClient(nil)
	}
	return nil
}

func (g *GitHubRepoScanner) setupWithURL() error {
	if g.accessToken == "" {
		return fmt.Errorf("access token required for github enterprise authentication")
	}

	tc := g.createTokenClient()

	var err error
	g.client, err = github.NewClient(tc).WithEnterpriseURLs(g.url, g.url)
	return err
}

// The go-github library does not directly handle authentication.
// Instead, when creating a new client, pass an http.Client that can handle authentication for you.
// https://pkg.go.dev/github.com/google/go-github/github#hdr-Authentication
func (g *GitHubRepoScanner) createTokenClient() *http.Client {
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: g.accessToken})
	return oauth2.NewClient(g.ctx, ts)
}

func (g *GitHubRepoScanner) trackAPICall() {
	g.requestsSinceCheck++
}

func (g *GitHubRepoScanner) processRepos(startTime, endTime *time.Time) ([]Finding, error) {
	var findings []Finding

	org, _, err := g.client.Organizations.Get(g.ctx, g.organization)
	g.trackAPICall()
	if err != nil {
		return nil, fmt.Errorf("failed to get organization: %w", err)
	}

	opts := &github.RepositoryListByOrgOptions{
		Type:      "all",
		Sort:      "pushed",
		Direction: "asc",
		ListOptions: github.ListOptions{
			PerPage: 100,
		},
	}

	// If start time is specified, reverse the sort order
	if startTime != nil {
		opts.Direction = "desc"
	}

	// Paginate through all repositories
	for {
		repos, resp, err := g.client.Repositories.ListByOrg(g.ctx, org.GetLogin(), opts)
		g.trackAPICall()
		if err != nil {
			return nil, fmt.Errorf("failed to list repositories: %w", err)
		}

		findingsForRepo, shouldContinue, err := g.processReposPage(repos, startTime, endTime)
		if err != nil {
			return nil, err
		}
		findings = append(findings, findingsForRepo...)

		if !shouldContinue || resp.NextPage == 0 {
			break
		}

		opts.Page = resp.NextPage
	}

	return findings, nil
}

func (g *GitHubRepoScanner) processReposPage(
	repos []*github.Repository,
	startTime, endTime *time.Time,
) ([]Finding, bool, error) {
	var findings []Finding

	for _, repo := range repos {
		if g.ignoreRepos[repo.GetID()] {
			continue
		}

		if (startTime != nil || endTime != nil) && !g.checkRepoIsInTimeFrame(repo.GetPushedAt().Time, startTime, endTime) {
			return findings, false, nil // Stop processing further pages
		}

		g.logger.Printf("Processing repository: %s", repo.GetFullName())

		finding, err := g.createFindingFromRepo(repo)
		if err != nil {
			g.logger.Printf("Warning: failed to create finding for repo %s: %v", repo.GetName(), err)
			continue
		}

		findings = append(findings, finding)

		// Respect rate limit after processing each repo
		if err := g.respectGitHubRateLimit(); err != nil {
			return findings, false, err
		}
	}

	return findings, true, nil // Continue to next page
}

func (g *GitHubRepoScanner) checkRepoIsInTimeFrame(
	pushedAt time.Time,
	startTime, endTime *time.Time,
) bool {
	// GitHub API returns timestamps in UTC
	pushedAt = pushedAt.UTC()

	if startTime != nil && pushedAt.Before(*startTime) {
		g.logger.Printf("Reached activity limit! Ignoring all repos with activity before `%s`.",
			startTime.Format(time.RFC3339))
		return false
	}

	if endTime != nil && pushedAt.After(*endTime) {
		g.logger.Printf("Reached activity limit! Ignoring all repos with activity after `%s`.",
			endTime.Format(time.RFC3339))
		return false
	}

	return true
}

func (g *GitHubRepoScanner) respectGitHubRateLimit() error {
	if !g.obeyRateLimit {
		return nil
	}

	// Determine check interval based on authentication
	// For unauthenticated (60/hour), check more frequently
	checkInterval := 50
	if g.accessToken == "" {
		checkInterval = 5
	}

	if g.requestsSinceCheck < checkInterval && time.Since(g.lastRateLimitCheck) < 30*time.Second {
		return nil
	}

	g.requestsSinceCheck = 0
	g.lastRateLimitCheck = time.Now()

	rate, _, err := g.client.RateLimit.Get(g.ctx)
	g.trackAPICall()
	if err != nil {
		return fmt.Errorf("failed to get rate limit: %w", err)
	}

	core := rate.GetCore()
	remaining := core.Remaining
	reset := core.Reset.Time
	limit := core.Limit

	// Determine threshold based on whether authenticated or not
	var lowThreshold int
	if limit <= 60 {
		lowThreshold = 10
		g.logger.Printf("Warning: Using unauthenticated GitHub API (60 requests/hour limit). Consider providing an access token for better performance.")
	} else {
		lowThreshold = 100
	}

	if remaining < lowThreshold {
		secondsUntilReset := time.Until(reset).Seconds() + 5
		if remaining > 0 {
			sleepTime := secondsUntilReset / float64(remaining)

			maxSleep := 10.0
			if sleepTime > maxSleep {
				sleepTime = maxSleep
				g.logger.Printf("Rate limit low (%d/%d remaining), sleeping %.1fs (capped)",
					remaining, limit, sleepTime)
			} else if sleepTime > 1 {
				g.logger.Printf("Rate limit low (%d/%d remaining), sleeping %.1fs between requests",
					remaining, limit, sleepTime)
			}

			if sleepTime > 0 {
				time.Sleep(time.Duration(sleepTime * float64(time.Second)))
			}
		} else {
			g.logger.Printf("Rate limit exhausted. Waiting until %s", reset.Format(time.RFC3339))
			time.Sleep(time.Until(reset) + 5*time.Second)
		}
	}

	return nil
}

func (g *GitHubRepoScanner) createFindingFromRepo(repo *github.Repository) (Finding, error) {
	var latestCommitID *string

	if g.annotateLatestCommitID {
		commits, _, err := g.client.Repositories.ListCommits(g.ctx,
			repo.GetOwner().GetLogin(),
			repo.GetName(),
			&github.CommitsListOptions{
				ListOptions: github.ListOptions{PerPage: 1},
			})
		g.trackAPICall()

		if err != nil {
			g.logger.Printf("Warning: Could not identify the latest commit ID - repository without commits?")
			empty := ""
			latestCommitID = &empty
		} else if len(commits) > 0 {
			sha := commits[0].GetSHA()
			latestCommitID = &sha
		}
	}

	visibility := "public"
	if repo.GetPrivate() {
		visibility = "private"
	}

	return g.CreateFinding(
		g.GitType(),
		fmt.Sprintf("%d", repo.GetID()),
		repo.GetHTMLURL(),
		repo.GetFullName(),
		repo.GetOwner().GetType(),
		fmt.Sprintf("%d", repo.GetOwner().GetID()),
		repo.GetOwner().GetLogin(),
		repo.GetCreatedAt().Format("2006-01-02T15:04:05Z"),
		repo.GetUpdatedAt().Format("2006-01-02T15:04:05Z"),
		visibility,
		repo.GetArchived(),
		repo.Topics,
		latestCommitID,
	), nil
}
