import argparse
import logging
import sys
import json
import calendar
import time
from datetime import datetime
import pytz

from typing import List
from pathlib import Path

# https://pypi.org/project/pytimeparse/
from pytimeparse.timeparse import timeparse
# https://docs.python.org/3/library/datetime.html
from datetime import timedelta

import gitlab
from gitlab.v4.objects import Project

import github
from github.Organization import Organization
from github.Repository import Repository
from github.PaginatedList import PaginatedList

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('git_repo_scanner')


def main():
    args = get_parser_args()

    findings = process(args)

    logger.info(' Write findings to file...')
    write_findings_to_file(args, findings)
    logger.info(' Finished!')


def process(args):
    if args.git_type == 'gitlab':
        return process_gitlab(args)
    else:
        return process_github(args)


def process_github(args):
    try:
        return parse_github(args)
    except github.GithubException as e:
        logger.info(f' Github API Exception: {e.status} -> {e.data["message"]}')
        sys.exit(-1)


def process_gitlab(args):
    try:
        return parse_gitlab(args)
    except gitlab.GitlabError as e:
        logger.info(f' Gitlab API Exception: {e}')
        sys.exit(-1)


def write_findings_to_file(args, findings):
    Path(args.file_output).mkdir(parents=True, exist_ok=True)
    with open(f'{args.file_output}/git-repo-scanner-findings.json', 'w') as out:
        json.dump(findings, out)


def get_parser_args(args=None):
    parser = argparse.ArgumentParser(description='Scan public or private git repositories of organizations or groups')
    parser.add_argument('--git-type',
                        help='Repository type can be github or GitLab',
                        choices=['github', 'gitlab'],
                        required=True)
    parser.add_argument('--file-output',
                        help='The path of the output file',
                        required=True),
    parser.add_argument('--url', help='The GitLab url or a GitHub enterprise api url.',
                        required=False)
    parser.add_argument('--access-token',
                        help='An access token for authentication',
                        required=False)
    parser.add_argument('--organization',
                        help='The name of the GitHub organization to scan',
                        required=False)
    parser.add_argument('--group',
                        help='The id of the GitLab group to scan',
                        required=False)
    parser.add_argument('--ignore-repos',
                        help='A list of repo ids to ignore',
                        action='extend',
                        nargs='+',
                        type=int,
                        default=[],
                        required=False)
    parser.add_argument('--ignore-groups',
                        help='A list of GitLab group ids to ignore',
                        action='extend',
                        nargs='+',
                        type=int,
                        default=[],
                        required=False)
    parser.add_argument('--obey-rate-limit',
                        help='True to obey the rate limit of the GitLab or GitHub server (default), otherwise False',
                        type=bool,
                        default=True,
                        required=False)
    parser.add_argument('--activity-since-duration',
                        help='Return git repo findings with repo activity (e.g. commits) more recent than a specific date expresed by an duration (now + duration)',
                        type=str,
                        required=False)
    parser.add_argument('--activity-until-duration',
                        help='Return git repo findings with repo activity (e.g. commits) older than a specific date expresed by an duration (now + duration)',
                        type=str,
                        required=False)

    if args:
        return parser.parse_args(args)
    else:
        return parser.parse_args()


def parse_gitlab(args):
    gl: gitlab.Gitlab
    if not args.url:
        logger.info(' URL required for GitLab connection.')
        sys.exit(-1)

    logger.info(' Gitlab authentication...')
    gl = gitlab_authenticate(args)

    logger.info(' Gitlab retrieve all repositories...')
    now_utc = pytz.utc.localize(datetime.utcnow())
    # Respect time filtering based on "pushed_at" (not "updated_at")
    # The difference is that "pushed_at" represents the date and time of the last commit, whereas the "updated_at" represents the date and time of the last change the the repository.
    # A change to the repository might be a commit, but it may also be other things, such as changing the description of the repo, creating wiki pages, etc.
    # In other words, commits are a subset of updates, and the pushed_at timestamp will therefore either be the same as the updated_at timestamp, or it will be an earlier timestamp.
    duration = 0
    activityDeltaDatetime = now_utc
    if args.activity_since_duration:
        activityDuration = timeparse(args.activity_since_duration)
        activityDeltaDatetime = timedelta(seconds=activityDuration)
        logger.info(' Get all GitLab Repos (filtered by last activity since ' + str(activityDeltaDatetime) + ' ago.)')

        projects: List[Project] = get_gitlab_projects_active_since(args, gl)
    elif args.activity_until_duration:
        activityDuration = timeparse(args.activity_until_duration)
        activityDeltaDatetime = timedelta(seconds=activityDuration)
        logger.info(' Get all GitLab Repos (filtered by last activity until ' + str(activityDeltaDatetime) + ' ago.)')

        projects: List[Project] = get_gitlab_projects_active_until(args, gl)
    else:
        logger.info(' Get all Gitlab Repos (not filtered)')
        projects: List[Project] = get_gitlab_projects_all(args, gl)

    logger.info(' Process Projects...')
    activityDate = now_utc - activityDeltaDatetime
    findings = process_gitlab_projects(args, projects, activityDeltaDatetime, activityDate)

    return findings


def process_gitlab_projects(args, projects, activityDeltaDatetime, activityDate):
    findings = []
    i = 1
    for project in projects:
        if is_not_on_ignore_list_gitlab(project, args.ignore_groups, args.ignore_repos):
            lastUpDatetime = datetime.fromisoformat(project.last_activity_at)
            logger.info(f' {i} - Name: {project.name} - LastUpdate: {lastUpDatetime}')
            i += 1

            # respect time filtering
            if args.activity_since_duration:
                if lastUpDatetime > activityDate:
                    findings.append(create_finding_gitlab(project))
                else:
                    logger.info(
                        f' Reached activity limit! Ignoring all repos with latest activity since `{activityDeltaDatetime}` ago ({str(activityDate)}).')
                    break
            elif args.activity_until_duration:
                if lastUpDatetime < activityDate:
                    findings.append(create_finding_gitlab(project))
                else:
                    logger.info(
                        f' Reached activity limit! Ignoring all repos with latest activity until `{activityDeltaDatetime}` ago ({str(activityDate)}).')
                    break
            else:
                findings.append(create_finding_gitlab(project))

    return findings


def get_gitlab_projects_all(args, gl):
    if args.group:
        try:
            projects = gl.groups.get(args.group).projects.list(all=True, include_subgroups=True,
                                                               obey_rate_limit=args.obey_rate_limit)
        except gitlab.exceptions.GitlabGetError:
            logger.info(' Group does not exist.')
            sys.exit(-1)
    else:
        projects = gl.projects.list(all=True, max_retries=12, obey_rate_limit=args.obey_rate_limit)
    return projects


def get_gitlab_projects_active_since(args, gl):
    if args.group:
        try:
            projects = gl.groups.get(args.group).projects.list(all=True, include_subgroups=True,
                                                               order_by='last_activity_at',
                                                               sort='desc', obey_rate_limit=args.obey_rate_limit)
        except gitlab.exceptions.GitlabGetError:
            logger.info(' Group does not exist.')
            sys.exit(-1)
    else:
        projects = gl.projects.list(all=True, max_retries=12, order_by='last_activity_at', sort='desc',
                                    obey_rate_limit=args.obey_rate_limit)
    return projects


def get_gitlab_projects_active_until(args, gl):
    if args.group:
        try:
            projects = gl.groups.get(args.group).projects.list(all=True, include_subgroups=True,
                                                               order_by='last_activity_at',
                                                               sort='asc', obey_rate_limit=args.obey_rate_limit)
        except gitlab.exceptions.GitlabGetError:
            logger.info(' Group does not exist.')
            sys.exit(-1)
    else:
        projects = gl.projects.list(all=True, max_retries=12, order_by='last_activity_at', sort='asc',
                                    obey_rate_limit=args.obey_rate_limit)
    return projects


def gitlab_authenticate(args):
    gl: gitlab.Gitlab
    if args.access_token:
        try:
            gl = gitlab.Gitlab(args.url, args.access_token)
            gl.auth()
        except gitlab.exceptions.GitlabAuthenticationError:
            gl = gitlab_authenticate_oauth(args)
    else:
        logger.info(' Access token required for GitLab authentication.')
        sys.exit(-1)
    logger.info(' Success')
    return gl


def gitlab_authenticate_oauth(args):
    try:
        gl = gitlab.Gitlab(args.url, oauth_token=args.access_token)
        gl.auth()
    except gitlab.exceptions.GitlabAuthenticationError:
        logger.info(' No permission. Check your access token.')
        sys.exit(-1)
    return gl


def parse_github(args):
    gh: github.Github = setup_github(args)

    logger.info(' Process Repositories...')

    if args.organization:
        findings = process_github_repos(args, gh)
        return findings
    else:
        logger.info(' No organization provided')
        sys.exit(-1)


def respect_github_ratelimit(args, gh):
    if args.obey_rate_limit:
        api_limit = gh.get_rate_limit().core
        reset_timestamp = calendar.timegm(api_limit.reset.timetuple())
        seconds_until_reset = reset_timestamp - calendar.timegm(
            time.gmtime()) + 5  # add 5 seconds to be sure the rate limit has been reset
        sleep_time = seconds_until_reset / api_limit.remaining

        logger.info(' Checking Rate-Limit (' + str(args.obey_rate_limit) + ') [remainingApiCalls: ' + str(
            api_limit.remaining) + ', seconds_until_reset: ' + str(seconds_until_reset) + ', sleepTime: ' + str(
            sleep_time) + ']')
        time.sleep(sleep_time)


def process_github_repos(args, gh):
    findings = []
    org: Organization = gh.get_organization(args.organization)

    # Respect time filtering based on "pushed_at" (not "updated_at")
    # The difference is that "pushed_at" represents the date and time of the last commit, whereas the "updated_at" represents the date and time of the last change the the repository.
    # A change to the repository might be a commit, but it may also be other things, such as changing the description of the repo, creating wiki pages, etc.
    # In other words, commits are a subset of updates, and the pushed_at timestamp will therefore either be the same as the updated_at timestamp, or it will be an earlier timestamp.
    duration = 0
    activityDeltaDatetime = datetime.now()
    if args.activity_since_duration:
        activityDuration = timeparse(args.activity_since_duration)
        activityDeltaDatetime = timedelta(seconds=activityDuration)
        logger.info(' Get all GitHub Repos (filtered by last activity since ' + str(activityDeltaDatetime) + ' ago.)')

        repos: PaginatedList[Repository] = org.get_repos(type='all', sort='pushed', direction='desc')
    elif args.activity_until_duration:
        activityDuration = timeparse(args.activity_until_duration)
        activityDeltaDatetime = timedelta(seconds=activityDuration)
        logger.info(' Get all GitHub Repos (filtered by last activity until ' + str(activityDeltaDatetime) + ' ago.)')

        repos: PaginatedList[Repository] = org.get_repos(type='all', sort='pushed', direction='asc')
    else:
        logger.info(' Get all GitHub Repos (not filtered)')
        repos: PaginatedList[Repository] = org.get_repos(type='all')

    activityDate = datetime.now() - activityDeltaDatetime

    for i in range(repos.totalCount):
        process_github_repos_page(args, findings, repos.get_page(i), gh, activityDeltaDatetime, activityDate)
    return findings


def process_github_repos_page(args, findings, repos, gh, activityDeltaDatetime, activityDate):
    repo: Repository
    for repo in repos:
        if repo.id not in args.ignore_repos:
            logger.info(
                f' {len(findings) + 1} - Name: {repo.name} - LastUpdate: {repo.updated_at} - LastPush: {repo.pushed_at}')

            # respect time filtering
            if args.activity_since_duration:
                if repo.updated_at > activityDate:
                    findings.append(create_finding_github(repo))
                    respect_github_ratelimit(args, gh)
                else:
                    logger.info(
                        f' Reached activity limit! Ignoring all repos with latest activity since `{activityDeltaDatetime}` ago ({str(activityDate)}).')
                    break
            elif args.activity_until_duration:
                if repo.updated_at < activityDate:
                    findings.append(create_finding_github(repo))
                    respect_github_ratelimit(args, gh)
                else:
                    logger.info(
                        f' Reached activity limit! Ignoring all repos with latest activity until `{activityDeltaDatetime}` ago ({str(activityDate)}).')
                    break
            else:
                findings.append(create_finding_github(repo))
                respect_github_ratelimit(args, gh)


def setup_github(args):
    if args.url:
        return setup_github_with_url(args)
    else:
        return setup_github_without_url(args)


def setup_github_without_url(args):
    if args.access_token:
        return github.Github(args.access_token)
    else:
        return github.Github()


def setup_github_with_url(args):
    if args.access_token:
        return github.Github(base_url=args.url, login_or_token=args.access_token)
    else:
        logger.info(' Access token required for github enterprise authentication.')
        sys.exit(-1)


def is_not_on_ignore_list_gitlab(project: Project, groups: List, repos: List):
    id_project = project.id
    kind = project.namespace['kind']
    id_namespace = project.namespace['id']
    if id_project in repos:
        return False
    if kind == 'group' and id_namespace in groups:
        return False
    return True


def create_finding_gitlab(project: Project):
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
        'name': 'GitHub Repo',
        'description': 'A GitHub repository',
        'category': 'Git Repository',
        'osi_layer': 'APPLICATION',
        'severity': 'INFORMATIONAL',
        'attributes': {
            'id': repo.id,
            'web_url': repo.html_url,
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
