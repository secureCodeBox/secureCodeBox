import argparse
import calendar
import json
import logging
import sys
import time
from datetime import datetime
# https://docs.python.org/3/library/datetime.html
from datetime import timedelta
from pathlib import Path

import github
import gitlab
import pytz
from github.Organization import Organization
from github.PaginatedList import PaginatedList
from github.Repository import Repository
from gitlab.v4.objects import Project
# https://pypi.org/project/pytimeparse/
from pytimeparse.timeparse import timeparse

from git_repo_scanner.gitlab_scanner import GitLabScanner

log_format = '%(asctime)s - %(levelname)-7s - %(name)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=log_format)
logger = logging.getLogger('git_repo_scanner')

now_utc = pytz.utc.localize(datetime.utcnow())


def main():
    args = get_parser_args()

    findings = process(args)

    logger.info('Write findings to file...')
    write_findings_to_file(args, findings)
    logger.info('Finished!')


def process(args):
    if args.git_type == 'gitlab':
        scanner = GitLabScanner(
            url=args.url,
            access_token=args.access_token,
            group=args.group,
            ignored_groups=args.ignore_groups,
            ignore_repos=args.ignore_repos,
            obey_rate_limit=args.obey_rate_limit
        )
    else:
        return parse_github(args)

    try:
        scanner.process(
            args.activity_since_duration,
            args.activity_until_duration
        )
    except argparse.ArgumentError as e:
        logger.error(f'Argument error: {e}')
        sys.exit(1)
    except gitlab.exceptions.GitlabAuthenticationError:
        logger.info('No permission. Check your access token.')
        sys.exit(1)
    except github.GithubException as e:
        logger.error(f'Github API Exception: {e.status} -> {e.data["message"]}')
        sys.exit(2)
    except gitlab.GitlabError as e:
        logger.error(f'Gitlab API Exception: {e}')
        sys.exit(2)
    except Exception as e:
        logger.error(f'Unexpected error: {e}')
        sys.exit(3)


def write_findings_to_file(args, findings):
    Path(args.file_output).mkdir(parents=True, exist_ok=True)
    with open(f'{args.file_output}/git-repo-scanner-findings.json', 'w') as out:
        json.dump(findings, out)


def parse_duration_as_datetime(val: str):
    try:
        parsed = timeparse(val)
        if parsed is None:
            raise argparse.ArgumentTypeError(f'Not a valid duration: {val}.')
        delta = timedelta(seconds=parsed)
        return now_utc - delta
    except Exception:
        raise argparse.ArgumentTypeError(f'Not a valid duration: {val}.')


def get_parser_args(args=None):
    parser = argparse.ArgumentParser(prog='git_repo_scanner',
                                     description='Scan public or private git repositories of organizations or groups')
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
                        type=int,
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
                        help='Return git repo findings with repo activity (e.g. commits) more recent than a specific '
                             'date expressed by a duration (now - duration)',
                        type=parse_duration_as_datetime,
                        required=False)
    parser.add_argument('--activity-until-duration',
                        help='Return git repo findings with repo activity (e.g. commits) older than a specific date '
                             'expressed by a duration (now - duration)',
                        type=parse_duration_as_datetime,
                        required=False)

    return parser.parse_args(args)


def parse_github(args):
    gh: github.Github = setup_github(args)

    logger.info('Process Repositories...')

    if args.organization:
        findings = process_github_repos(args, gh)
        return findings
    else:
        logger.info('No organization provided')
        sys.exit(-1)


def respect_github_ratelimit(args, gh):
    if args.obey_rate_limit:
        api_limit = gh.get_rate_limit().core
        reset_timestamp = calendar.timegm(api_limit.reset.timetuple())
        seconds_until_reset = reset_timestamp - calendar.timegm(
            time.gmtime()) + 5  # add 5 seconds to be sure the rate limit has been reset
        sleep_time = seconds_until_reset / api_limit.remaining

        logger.info('Checking Rate-Limit (' + str(args.obey_rate_limit) + ') [remainingApiCalls: ' + str(
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
        logger.info('Get all GitHub Repos (filtered by last activity since ' + str(activityDeltaDatetime) + 'ago.)')

        repos: PaginatedList[Repository] = org.get_repos(type='all', sort='pushed', direction='desc')
    elif args.activity_until_duration:
        activityDuration = timeparse(args.activity_until_duration)
        activityDeltaDatetime = timedelta(seconds=activityDuration)
        logger.info('Get all GitHub Repos (filtered by last activity until ' + str(activityDeltaDatetime) + 'ago.)')

        repos: PaginatedList[Repository] = org.get_repos(type='all', sort='pushed', direction='asc')
    else:
        logger.info('Get all GitHub Repos (not filtered)')
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
                f'{len(findings) + 1} - Name: {repo.name} - LastUpdate: {repo.updated_at} - LastPush: {repo.pushed_at}')

            # respect time filtering
            if args.activity_since_duration:
                if repo.updated_at > activityDate:
                    findings.append(create_finding_github(repo))
                    respect_github_ratelimit(args, gh)
                else:
                    logger.info(
                        f'Reached activity limit! Ignoring all repos with latest activity since `{activityDeltaDatetime}` ago ({str(activityDate)}).')
                    break
            elif args.activity_until_duration:
                if repo.updated_at < activityDate:
                    findings.append(create_finding_github(repo))
                    respect_github_ratelimit(args, gh)
                else:
                    logger.info(
                        f'Reached activity limit! Ignoring all repos with latest activity until `{activityDeltaDatetime}` ago ({str(activityDate)}).')
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
        logger.info('Access token required for github enterprise authentication.')
        sys.exit(-1)


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
