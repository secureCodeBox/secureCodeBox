import argparse
import logging
import sys
import json
from typing import List
from pathlib import Path

import gitlab
from gitlab.v4.objects import Project

import github
from github.Organization import Organization
from github.Repository import Repository
from github.PaginatedList import PaginatedList

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('git_repo_scanner')


def main():
    parser = argparse.ArgumentParser(description='Scan public or private git repositories of organizations or groups')
    parser.add_argument('--git-type',
                        help='Repository type can be github or gitlab',
                        choices=['github', 'gitlab'],
                        required=True)
    parser.add_argument('--file-output',
                        help='The path of the output file',
                        required=True),
    parser.add_argument('--url', help='The gitlab url or a github enterprise api url.',
                        required=False)
    parser.add_argument('--access-token',
                        help='An access token for authentication',
                        required=False)
    parser.add_argument('--organization',
                        help='The name of the githup organization to scan',
                        required=False)
    parser.add_argument('--group',
                        help='The id of the gitlab group to scan',
                        required=False)
    parser.add_argument('--ignore-repos',
                        help='A list of repo ids to ignore',
                        action='extend',
                        nargs='+',
                        type=int,
                        default=[],
                        required=False)
    parser.add_argument('--ignore-groups',
                        help='A list of gitlab group ids to ignore',
                        action='extend',
                        nargs='+',
                        type=int,
                        default=[],
                        required=False)
    args = parser.parse_args()

    if args.git_type == 'gitlab':
        try:
            findings = parse_gitlab(args)
        except gitlab.GitlabError as e:
            logger.info(f' Gitlab API Exception: {e}')
            sys.exit(-1)
    else:
        try:
            findings = parse_github(args)
        except github.GithubException as e:
            logger.info(f' Github API Exception: {e.status} -> {e.data["message"]}')
            sys.exit(-1)

    logger.info(' Write findings to file...')
    Path(args.file_output).mkdir(parents=True, exist_ok=True)
    with open(f'{args.file_output}/git-repo-scanner-findings.json', 'w') as out:
        json.dump(findings, out)
    logger.info(' Finished!')


def parse_gitlab(args):
    gl: gitlab.Gitlab
    if not args.url:
        logger.info(' URL required for gitlab connection.')
        sys.exit(-1)
    logger.info(' Gitlab authentication...')
    if args.access_token:
        try:
            gl = gitlab.Gitlab(args.url, args.access_token)
            gl.auth()
        except gitlab.exceptions.GitlabAuthenticationError:
            try:
                gl = gitlab.Gitlab(args.url, oauth_token=args.access_token)
                gl.auth()
            except gitlab.exceptions.GitlabAuthenticationError:
                logger.info(' No permission. Check your access token.')
                sys.exit(-1)
    else:
        logger.info(' Access token required for gitlab authentication.')
        sys.exit(-1)
    logger.info(' Success')

    projects: List[Project]
    if args.group:
        try:
            projects = gl.groups.get(args.group).projects.list(all=True, include_subgroups=True)
        except gitlab.exceptions.GitlabGetError:
            logger.info(' Group does not exist.')
            sys.exit(-1)
    else:
        projects = gl.projects.list(all=True, max_retries=12)
    logger.info(' Process Projects...')

    findings = []
    i = 1
    for project in projects:
        if is_not_on_ignorelist_gitlab(project, args.ignore_groups, args.ignore__repos):
            logger.info(f' {i} - {project.name}')
            i += 1
            findings.append(create_finding_gitlab(project))
    return findings


def parse_github(args):
    gh: github.Github
    if args.url:
        if args.access_token:
            gh = github.Github(base_url=args.url, login_or_token=args.access_token)
        else:
            logger.info(' Access token required for github enterprise authentication.')
            sys.exit(-1)
    else:
        if args.access_token:
            gh = github.Github(args.access_token)
        else:
            gh = github.Github()

    logger.info(' Process Repositories...')

    if args.organization:
        findings = []
        org: Organization = gh.get_organization(args.organization)
        repos: PaginatedList[Repository] = org.get_repos(type='all')
        j = 1
        for i in range(repos.totalCount):
            repo: Repository
            for repo in repos.get_page(i):
                if repo.id not in args.ignore_repos:
                    logger.info(f' {j} - {repo.name}')
                    j += 1
                    findings.append(create_finding_github(repo))
        return findings
    else:
        logger.info(' No organization provided')
        sys.exit(-1)


def is_not_on_ignorelist_gitlab(project: Project, groups: List, repos: List):
    id_project = project.id
    kind = project.namespace['kind']
    id_namespace = project.namespace['id']
    if id_project in repos:
        return False
    if kind == 'group' and id_namespace in groups:
        return False
    return True


def create_finding_gitlab(project):
    return {
        'name': 'GitLab Repo',
        'description': 'A GitLab repository',
        'category': 'Git Repository',
        'osi_layer': 'APPLICATION',
        'severity': 'INFORMATIONAL',
        'attributes': {
            'id': project.id,
            'web_url': project.web_url,
            'full_name': project.path_with_namespace,
            'owner_type': project.namespace['kind'],
            'owner_id': project.namespace['id'],
            'owner_name': project.namespace['name'],
            'created_at': project.created_at,
            'last_activity_at': project.last_activity_at,
            'visibility': project.visibility
        }
    }


def create_finding_github(repo: Repository):
    return {
        'name': 'Github Repo',
        'description': 'A Github repository',
        'category': 'Git Repository',
        'osi_layer': 'APPLICATION',
        'severity': 'INFORMATIONAL',
        'attributes': {
            'id': repo.id,
            'web_url': repo.url,
            'full_name': repo.full_name,
            'owner_type': repo.owner.type,
            'owner_id': repo.owner.id,
            'owner_name': repo.owner.name,
            'created_at': repo.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            'last_activity_at': repo.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            'visibility': 'private' if repo.private else 'public'
        }
    }


if __name__ == '__main__':
    main()
