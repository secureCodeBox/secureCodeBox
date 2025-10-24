# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

import argparse
import logging
import time
from calendar import timegm
from datetime import datetime, timezone
from typing import Optional, List

import github
from github.Organization import Organization
from github.PaginatedList import PaginatedList
from github.Repository import Repository

from git_repo_scanner.abstract_scanner import AbstractScanner, FINDING


class GitHubScanner(AbstractScanner):
    LOGGER = logging.getLogger("git_repo_scanner")

    def __init__(
        self,
        url: Optional[str],
        access_token: Optional[str],
        organization: str,
        ignore_repos: List[int],
        obey_rate_limit: bool = True,
        annotate_latest_commit_id: bool = False,
    ) -> None:
        super().__init__()
        if not organization:
            raise argparse.ArgumentError(
                None, "Organization required for GitHub connection."
            )
        if url and not access_token:
            raise argparse.ArgumentError(
                None, "Access token required for GitHub connection."
            )

        self._url = url
        self._access_token = access_token
        self._organization = organization
        self._ignore_repos = ignore_repos
        self._obey_rate_limit = obey_rate_limit
        self._annotate_latest_commit_id = annotate_latest_commit_id
        self._gh: Optional[github.Github] = None

    @property
    def git_type(self) -> str:
        return "GitHub"

    def process(
        self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
    ) -> List[FINDING]:
        self._setup()
        return self._process_repos(start_time, end_time)

    def _process_repos(
        self, start_time: Optional[datetime], end_time: Optional[datetime]
    ):
        findings = []
        org: Organization = self._gh.get_organization(self._organization)

        repos: PaginatedList[Repository] = org.get_repos(
            type="all", sort="pushed", direction="asc"
        )

        if start_time:
            repos = org.get_repos(type="all", sort="pushed", direction="desc")

        is_over = False
        for i in range(repos.totalCount):
            if is_over:
                break
            is_over = self._process_repos_page(
                findings, repos.get_page(i), start_time, end_time
            )

        return findings

    def _process_repos_page(
        self,
        findings: List[FINDING],
        repos: List[Repository],
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> bool:
        repo: Repository
        for repo in repos:
            if repo.id not in self._ignore_repos:

                self._respect_github_ratelimit()
                self.LOGGER.info(
                    f"{len(findings) + 1} - Name: {repo.name} - LastUpdate: {repo.updated_at} - LastPush: {repo.pushed_at}"
                )

                if (start_time or end_time) and not self._check_repo_is_in_time_frame(
                    repo.pushed_at, start_time, end_time
                ):
                    self.LOGGER.info(
                        f"Repository '{repo.name}' is outside the specified time frame."
                    )
                    if start_time and end_time and repo.pushed_at < start_time:
                        return True
                    elif start_time and not end_time and repo.pushed_at < start_time:
                        return True
                    elif end_time and not start_time and repo.pushed_at > end_time:
                        return True
                    else:
                        continue

                findings.append(self._create_finding_from_repo(repo))
        return False

    def _check_repo_is_in_time_frame(
        self,
        pushed_at: datetime,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ):
        pushed_at = pushed_at.replace(tzinfo=timezone.utc)

        if start_time and end_time:
            return start_time <= pushed_at <= end_time
        elif start_time:
            return pushed_at >= start_time
        elif end_time:
            return pushed_at <= end_time
        else:
            return True

    def _respect_github_ratelimit(self):
        if self._obey_rate_limit:
            api_limit = self._gh.get_rate_limit().resources.core
            self.LOGGER.info(
                f"Checking Rate-Limit ({self._obey_rate_limit}) [remainingApiCalls: {api_limit.remaining}]"
            )

            if api_limit.remaining < 5:
                reset_timestamp = timegm(api_limit.reset.timetuple())
                # add 5 seconds to be sure the rate limit has been reset
                seconds_until_reset = reset_timestamp - timegm(time.gmtime()) + 5
                self.LOGGER.info(
                    f"Rate limit almost exceeded. Sleeping for {seconds_until_reset} seconds."
                )
                time.sleep(seconds_until_reset)
                return

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
            self._gh = github.Github(
                base_url=self._url, login_or_token=self._access_token
            )
        else:
            raise argparse.ArgumentError(
                None, "Access token required for github enterprise authentication."
            )

    def _create_finding_from_repo(self, repo: Repository) -> FINDING:
        latest_commit: str = None
        if self._annotate_latest_commit_id:
            try:
                latest_commit = repo.get_commits()[0].sha
            except Exception:
                self.LOGGER.warn(
                    "Could not identify the latest commit ID - repository without commits?"
                )
                latest_commit = ""
        return super()._create_finding(
            str(repo.id),
            repo.html_url,
            repo.full_name,
            repo.owner.type,
            str(repo.owner.id),
            repo.owner.name,
            repo.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            repo.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "private" if repo.private else "public",
            repo.archived,
            repo.get_topics(),
            latest_commit,
        )
