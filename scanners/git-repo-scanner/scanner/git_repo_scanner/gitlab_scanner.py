# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

import argparse
import logging
from datetime import datetime
from typing import List, Optional

import gitlab
from gitlab.v4.objects import Project, ProjectManager

from git_repo_scanner.abstract_scanner import AbstractScanner, FINDING

logger = logging.getLogger('git_repo_scanner')


class GitLabScanner(AbstractScanner):
    LOGGER = logging.getLogger('git_repo_scanner')

    def __init__(self, url: str,
                 access_token: str,
                 group: Optional[int],
                 ignored_groups: List[int],
                 ignore_repos: List[int],
                 obey_rate_limit: bool = True) -> None:
        super().__init__()
        if not url:
            raise argparse.ArgumentError(None, 'URL required for GitLab connection.')
        if not access_token:
            raise argparse.ArgumentError(None, 'Access token required for GitLab authentication.')

        self._url = url
        self._access_token = access_token
        self._group = group
        self._ignored_groups = ignored_groups
        self._ignore_repos = ignore_repos
        self._obey_rate_limit = obey_rate_limit
        self._gl: Optional[gitlab.Gitlab] = None

    @property
    def git_type(self) -> str:
        return 'GitLab'

    def process(self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None) -> List[FINDING]:
        self._authenticate()

        projects: List[Project] = self._get_projects(start_time, end_time)
        return self._process_projects(projects)

    def _get_projects(self, start_time: Optional[datetime], end_time: Optional[datetime]):
        logger.info(f'Get GitLab repositories with last activity between {start_time} and {end_time}.')

        project_manager: ProjectManager = self._gl.projects
        options = dict(
            all=True,
            order_by='last_activity_at',
            sort='desc',
            obey_rate_limit=self._obey_rate_limit,
            max_retries=12
        )
        if start_time is not None:
            options['last_activity_after'] = start_time
        if end_time is not None:
            options['last_activity_before'] = end_time

        if self._group:
            options['include_subgroups'] = True
            project_manager = self._gl.groups.get(self._group).projects

        return project_manager.list(**options)

    def _process_projects(self, projects: List[Project]) -> List[FINDING]:
        project_count = len(projects)
        return [
            self._create_finding_from_project(project, i, project_count)
            for i, project in enumerate(projects)
            if self._is_not_ignored(project)
        ]

    def _authenticate(self):
        logger.info('Start GitLab authentication')
        try:
            self._gl = gitlab.Gitlab(self._url, private_token=self._access_token)
            self._gl.auth()
        except gitlab.exceptions.GitlabAuthenticationError:
            self._gl = gitlab.Gitlab(self._url, oauth_token=self._access_token)
            self._gl.auth()

        logger.info('GitLab authentication succeeded')

    def _is_not_ignored(self, project: Project) -> bool:
        id_project = project.id
        kind = project.namespace['kind']
        id_namespace = project.namespace['id']
        if id_project in self._ignore_repos:
            return False
        if kind == 'group' and id_namespace in self._ignored_groups:
            return False
        return True

    def _create_finding_from_project(self, project: Project, index: int, total: int) -> FINDING:
        logger.info(
            f'({index + 1}/{total}) Add finding for repo {project.name} with last activity at '
            f'{datetime.fromisoformat(project.last_activity_at)}')
        return super()._create_finding(
            project.id,
            project.web_url,
            project.path_with_namespace,
            project.namespace['kind'],
            project.namespace['id'],
            project.namespace['name'],
            project.created_at,
            project.last_activity_at,
            project.visibility
        )
