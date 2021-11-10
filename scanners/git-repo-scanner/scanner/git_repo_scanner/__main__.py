# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

import argparse
import json
import logging
import sys
from datetime import datetime
# https://docs.python.org/3/library/datetime.html
from datetime import timedelta
from pathlib import Path

import github
import gitlab
import pytz
# https://pypi.org/project/pytimeparse/
from pytimeparse.timeparse import timeparse

from git_repo_scanner.abstract_scanner import AbstractScanner
from git_repo_scanner.github_scanner import GitHubScanner
from git_repo_scanner.gitlab_scanner import GitLabScanner

log_format = '%(asctime)s - %(levelname)-7s - %(name)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=log_format)
logger = logging.getLogger('git_repo_scanner')

now_utc = pytz.utc.localize(datetime.utcnow())


def main():
    args = get_parser_args()

    if not args.git_type:
        logger.info('Argument error: No git type specified')
        sys.exit(1)

    findings = process(args)

    logger.info('Write findings to file...')
    write_findings_to_file(args, findings)
    logger.info('Finished!')


def process(args):
    scanner: AbstractScanner

    if args.git_type == 'gitlab':
        scanner = GitLabScanner(
            url=args.url,
            access_token=args.access_token,
            group=args.group,
            ignored_groups=args.ignore_groups,
            ignore_repos=args.ignore_repos,
            obey_rate_limit=args.obey_rate_limit,
            annotate_latest_commit_id=args.annotate_latest_commit_id
        )
    elif args.git_type == 'github':
        scanner = GitHubScanner(
            url=args.url,
            access_token=args.access_token,
            organization=args.organization,
            ignore_repos=args.ignore_repos,
            obey_rate_limit=args.obey_rate_limit,
            annotate_latest_commit_id=args.annotate_latest_commit_id
        )
    else:
        logger.info('Argument error: Unknown git type')
        sys.exit(1)

    try:
        return scanner.process(
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
    parser.add_argument('--annotate-latest-commit-id',
                        help="Annotate the results with the latest commit hash of the main branch of the repository. "
                             "Will result in up to two extra API hits per repository",
                        type=bool,
                        default=False,
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


if __name__ == '__main__':
    main()
