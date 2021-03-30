import argparse
import logging
import time
from calendar import calendar
from datetime import datetime
from typing import Optional, List

import github
from github.Organization import Organization
from github.PaginatedList import PaginatedList
from github.Repository import Repository

from git_repo_scanner.abstract_scanner import AbstractScanner, FINDING


class GitHubScanner(AbstractScanner):
    LOGGER = logging.getLogger('git_repo_scanner')

    def __init__(self, url: str, access_token: str, organization: str, ignore_repos: List[int],
                 obey_rate_limit: bool = True) -> None:
        super().__init__()
        if not url:
            raise argparse.ArgumentError(None, 'URL required for GitLab connection.')
        if not organization:
            raise argparse.ArgumentError(None, 'Organization required for GitLab connection.')

        self._url = url
        self._access_token = access_token
        self._organization = organization
        self._ignore_repos = ignore_repos
        self._obey_rate_limit = obey_rate_limit
        self._gh: Optional[github.Github] = None

    @property
    def git_type(self) -> str:
        return 'GitHub'

    def process(self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None) -> List[FINDING]:
        self._setup()
        return self._process_repos(start_time, end_time)

    def _process_repos(self, start_time: Optional[datetime], end_time: Optional[datetime]):
        findings = []
        org: Organization = self._gh.get_organization(self._organization)

        repos: PaginatedList[Repository] = org.get_repos(type='all', sort='pushed', direction='desc')

        for i in range(repos.totalCount):
            _process_repos_page(findings, repos.get_page(i), start_time, end_time)
        return findings

    def _process_repos_page(self,
                            findings: List[FINDING],
                            repos: PaginatedList[Repository],
                            start_time: Optional[datetime] = None,
                            end_time: Optional[datetime] = None):
        repo: Repository
        for repo in repos:
            if repo.id not in self._ignore_repos:
                self.LOGGER.info(
                    f'{len(findings) + 1} - Name: {repo.name} - LastUpdate: {repo.updated_at} - LastPush: {repo.pushed_at}')

                # respect time filtering
                if start_time:
                    if repo.updated_at > start_time:
                        findings.append(self._create_finding_from_repo(repo))
                        self._respect_github_ratelimit()
                    else:
                        self.LOGGER.info(
                            f'Reached activity limit! Ignoring all repos with latest activity since `{activityDeltaDatetime}` ago ({str(activityDate)}).')
                        break
                elif end_time:
                    if repo.updated_at < end_time:
                        findings.append(self._create_finding_from_repo(repo))
                        self._respect_github_ratelimit()
                    else:
                        self.LOGGER.info(
                            f'Reached activity limit! Ignoring all repos with latest activity until `{activityDeltaDatetime}` ago ({str(activityDate)}).')
                        break
                else:
                    findings.append(self._create_finding_from_repo(repo))
                    self._respect_github_ratelimit()

    def _respect_github_ratelimit(self):
        if self._obey_rate_limit:
            api_limit = self._gh.get_rate_limit().core
            reset_timestamp = calendar.timegm(api_limit.reset.timetuple())
            seconds_until_reset = reset_timestamp - calendar.timegm(
                time.gmtime()) + 5  # add 5 seconds to be sure the rate limit has been reset
            sleep_time = seconds_until_reset / api_limit.remaining

            self.LOGGER.info('Checking Rate-Limit (' + str(self._obey_rate_limit) + ') [remainingApiCalls: ' + str(
                api_limit.remaining) + ', seconds_until_reset: ' + str(seconds_until_reset) + ', sleepTime: ' + str(
                sleep_time) + ']')
            time.sleep(sleep_time)

    def _setup(self):
        if self._url:
            self._setup_with_url()
        else:
            self._setup_without_url()

    def _setup_without_url(self):
        if self._access_token:
            self._gh = github.Github(self._access_token)
        else:
            self._gh = github.Github()

    def _setup_with_url(self):
        if self._access_token:
            self._gh = github.Github(base_url=self._url, login_or_token=self._access_token)
        else:
            raise argparse.ArgumentError(None, 'Access token required for github enterprise authentication.')

    def _create_finding_from_repo(self, repo: Repository, index: int, total: int) -> FINDING:
        self.LOGGER.info(
            f'({index + 1}/{total}) Add finding for repo {repo.full_name} with last activity at '
            f'{repo.updated_at}')
        return super()._create_finding(
            str(repo.id),
            repo.html_url,
            repo.full_name,
            repo.owner.type,
            str(repo.owner.id),
            repo.owner.name,
            repo.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            repo.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            'private' if repo.private else 'public'
        )
