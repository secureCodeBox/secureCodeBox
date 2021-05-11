# SPDX-FileCopyrightText: 2020 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

import argparse
import datetime
import unittest
from datetime import timezone
from unittest.mock import MagicMock, Mock
from unittest.mock import patch

import gitlab
from gitlab.v4.objects import Project, ProjectManager

from git_repo_scanner.__main__ import get_parser_args
from git_repo_scanner.github_scanner import GitHubScanner
from git_repo_scanner.gitlab_scanner import GitLabScanner


class GitRepoScannerTests(unittest.TestCase):

    @property
    def wrong_output_msg(self) -> str:
        return 'Test finding output'

    def test_process_gitlab_projects_with_no_ignore_list(self):
        # given
        scanner = GitLabScanner('url', 'token', None, [], [])
        projects = assemble_projects()
        # when
        findings = scanner._process_projects(projects)
        # then
        self.assertEqual(3, len(findings), msg='There should be exactly 3 findings')
        self.assertEqual(findings[0]['name'], 'GitLab Repo', msg=self.wrong_output_msg)
        self.assertEqual(findings[0]['attributes']['web_url'], 'url1', msg=self.wrong_output_msg)
        self.assertEqual(findings[1]['attributes']['web_url'], 'url2', msg=self.wrong_output_msg)
        self.assertEqual(findings[2]['attributes']['web_url'], 'url3', msg=self.wrong_output_msg)

    def test_process_gitlab_projects_with_ignore_group(self):
        # given
        scanner = GitLabScanner('url', 'token', None, [33], [])
        projects = assemble_projects()
        # when
        findings = scanner._process_projects(projects)
        # then
        self.assertEqual(2, len(findings), msg='There should be exactly 2 findings')
        self.assertEqual(findings[0]['attributes']['web_url'], 'url1', msg=self.wrong_output_msg)
        self.assertEqual(findings[1]['attributes']['web_url'], 'url2', msg=self.wrong_output_msg)

    def test_process_gitlab_projects_with_ignore_project(self):
        # given
        scanner = GitLabScanner('url', 'token', None, [], [1])
        projects = assemble_projects()
        # when
        findings = scanner._process_projects(projects)
        # then
        self.assertEqual(2, len(findings), msg='There should be exactly 2 findings')
        self.assertEqual(findings[0]['attributes']['web_url'], 'url2', msg=self.wrong_output_msg)
        self.assertEqual(findings[1]['attributes']['web_url'], 'url3', msg=self.wrong_output_msg)

    @patch('github.Github')
    @patch('github.Organization')
    @patch('github.PaginatedList')
    def test_process_github_repos_with_no_ignore_list(self, github_mock, org_mock, pag_mock):
        # given
        scanner = GitHubScanner('url', 'token', 'org', [], False)
        repos = assemble_repos()
        create_mocks(github_mock, org_mock, pag_mock, repos)
        scanner._gh = github_mock
        # when
        findings = scanner._process_repos(None, None)
        # then
        org_mock.get_repos.assert_called_with(type='all', sort='pushed', direction='asc')
        self.assertEqual(6, len(findings), msg='There should be exactly 6 findings')
        for finding in findings:
            self.assertEqual(finding['name'], 'GitHub Repo', msg=self.wrong_output_msg)

    @patch('github.Github')
    @patch('github.Organization')
    @patch('github.PaginatedList')
    def test_process_github_repos_with_ignore_repos(self, github_mock, org_mock, pag_mock):
        # given
        scanner = GitHubScanner('url', 'token', 'org', [1], False)
        repos = assemble_repos()
        create_mocks(github_mock, org_mock, pag_mock, repos)
        scanner._gh = github_mock
        # when
        findings = scanner._process_repos(None, None)
        # then
        github_mock.get_organization.assert_called_with('org')
        self.assertEqual(4, len(findings), msg='There should be exactly 4 findings')

    def test_setup_github_with_url_and_no_token_should_exit(self):
        # when
        with self.assertRaises(argparse.ArgumentError) as cm:
            GitHubScanner('url', None, 'org', [])
        # then
        self.assertEqual(cm.exception.args[1], 'Access token required for GitHab connection.',
                         msg='Process should exit')


def get_args(ignore_groups=0, ignore_projects=0, url=None, access_token=None, org=None):
    args = ['--git-type', 'someType',
            '--file-output', 'out',
            '--obey-rate-limit', False,
            '--ignore-repos', str(ignore_projects),
            '--ignore-groups', str(ignore_groups)]
    if url:
        args.append('--url')
        args.append(url)
    if access_token:
        args.append('--access-token')
        args.append(access_token)
    if org:
        args.append('--organization')
        args.append(org)

    return get_parser_args(args)


def create_mocks(github_mock, org_mock, pag_mock, repos):
    pag_mock.totalCount = 2
    pag_mock.get_page = MagicMock(return_value=repos)
    org_mock.get_repos = MagicMock(return_value=pag_mock)
    github_mock.get_organization = MagicMock(return_value=org_mock)


def assemble_projects():
    created = datetime.datetime(2020, 10, 10, tzinfo=timezone.utc).isoformat()
    updated = datetime.datetime(2020, 11, 10, tzinfo=timezone.utc).isoformat()
    project1 = assemble_project(p_id=1, name='name1', url='url1', path='path1', date_created=created,
                                date_updated=updated, visibility='private', o_id=11, o_kind='group',
                                o_name='name11')
    project2 = assemble_project(p_id=2, name='name2', url='url2', path='path2', date_created=created,
                                date_updated=updated, visibility='private', o_id=22, o_kind='user',
                                o_name='name22')
    project3 = assemble_project(p_id=3, name='name3', url='url3', path='path3', date_created=created,
                                date_updated=updated, visibility='private', o_id=33, o_kind='group',
                                o_name='name33')
    return [project1, project2, project3]


def assemble_project(p_id, name, url, path, date_created, date_updated, visibility, o_id, o_kind, o_name):
    project = Project(ProjectManager(gitlab), {})
    project.id = p_id
    project.name = name
    project.web_url = url
    project.path_with_namespace = path
    project.created_at = date_created
    project.last_activity_at = date_updated
    project.visibility = visibility
    project.namespace = {
        'kind': o_kind,
        'id': o_id,
        'name': o_name
    }
    return project


def assemble_repos():
    date = datetime.datetime(2020, 5, 17, tzinfo=timezone.utc)
    project1 = assemble_repository(p_id=1, name='name1', url='url1', path='path1', date_created=date,
                                   date_updated=date, date_pushed=date, visibility=True, o_id=11, o_kind='organization',
                                   o_name='name11')
    project2 = assemble_repository(p_id=2, name='name2', url='url2', path='path2', date_created=date,
                                   date_updated=date, date_pushed=date, visibility=False, o_id=22,
                                   o_kind='organization',
                                   o_name='name22')
    project3 = assemble_repository(p_id=3, name='name3', url='url3', path='path3', date_created=date,
                                   date_updated=date, date_pushed=date, visibility=False, o_id=33,
                                   o_kind='organization',
                                   o_name='name33')
    return [project1, project2, project3]


def assemble_repository(p_id, name, url, path, date_created: datetime, date_updated: datetime, date_pushed: datetime,
                        visibility: bool, o_id,
                        o_kind, o_name):

    repo = Mock()
    owner = Mock()
    owner.type = o_kind
    owner.id = o_id
    owner.name = o_name
    repo.id = p_id
    repo.name = name
    repo.html_url = url
    repo.full_name = path
    repo.created_at = date_created
    repo.pushed_at = date_pushed
    repo.updated_at = date_updated
    repo.private = visibility
    repo.owner = owner
    return repo


if __name__ == '__main__':
    unittest.main()
