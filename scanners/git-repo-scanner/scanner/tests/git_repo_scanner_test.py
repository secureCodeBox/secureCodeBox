# SPDX-FileCopyrightText: the secureCodeBox authors
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
        return "Test finding output"

    def prepare_gitlab_commitlist_mock(self, mock_gptp, mock_commitmanager):
        mock_gptp.side_effect = self._mock_group_project_to_project
        mock_commitmanager.return_value = [Mock(id="deadbeef")]

    def _mock_group_project_to_project(self, project):
        return project

    @patch("gitlab.v4.objects.ProjectCommitManager.list")
    @patch("git_repo_scanner.gitlab_scanner.GitLabScanner._group_project_to_project")
    def test_process_gitlab_projects_with_no_ignore_list(
        self, mock_gptp, mock_commitmanager
    ):
        # given
        scanner = GitLabScanner(
            "url", "token", None, [], [], annotate_latest_commit_id=True
        )
        projects = assemble_projects()
        self.prepare_gitlab_commitlist_mock(mock_gptp, mock_commitmanager)
        # when
        findings = scanner._process_projects(projects)
        # then
        self.assertEqual(3, len(findings), msg="There should be exactly 3 findings")
        self.assertEqual(findings[0]["name"], "GitLab Repo", msg=self.wrong_output_msg)
        self.assertEqual(
            findings[0]["attributes"]["web_url"], "url1", msg=self.wrong_output_msg
        )
        self.assertEqual(
            findings[1]["attributes"]["web_url"], "url2", msg=self.wrong_output_msg
        )
        self.assertEqual(
            findings[2]["attributes"]["web_url"], "url3", msg=self.wrong_output_msg
        )
        self.assertEqual(findings[0]["attributes"]["last_commit_id"], "deadbeef")
        self.assertEqual(findings[1]["attributes"]["archived"], False)
        self.assertEqual(findings[2]["attributes"]["archived"], True)
        self.assertEqual(findings[0]["attributes"]["topics"], [])
        self.assertEqual(findings[2]["attributes"]["topics"], ["outdated"])
        mock_gptp.assert_called()
        mock_commitmanager.assert_called()

    @patch("gitlab.v4.objects.ProjectCommitManager.list")
    @patch("git_repo_scanner.gitlab_scanner.GitLabScanner._group_project_to_project")
    def test_process_gitlab_projects_without_annotating_commit_id(
        self, mock_gptp, mock_commitmanager
    ):
        # given
        scanner = GitLabScanner(
            "url", "token", None, [], [], annotate_latest_commit_id=False
        )
        projects = assemble_projects()
        self.prepare_gitlab_commitlist_mock(mock_gptp, mock_commitmanager)
        # when
        findings = scanner._process_projects(projects)
        # then
        self.assertEqual(3, len(findings), msg="There should be exactly 3 findings")
        self.assertEqual(findings[0]["name"], "GitLab Repo", msg=self.wrong_output_msg)
        self.assertEqual(
            findings[0]["attributes"]["web_url"], "url1", msg=self.wrong_output_msg
        )
        self.assertEqual(
            findings[1]["attributes"]["web_url"], "url2", msg=self.wrong_output_msg
        )
        self.assertEqual(
            findings[2]["attributes"]["web_url"], "url3", msg=self.wrong_output_msg
        )
        self.assertFalse("last_commit_id" in findings[0]["attributes"])
        mock_gptp.assert_not_called()
        mock_commitmanager.assert_not_called()

    @patch("gitlab.v4.objects.ProjectCommitManager.list")
    @patch("git_repo_scanner.gitlab_scanner.GitLabScanner._group_project_to_project")
    def test_process_gitlab_projects_with_ignore_group(
        self, mock_gptp, mock_commitmanager
    ):
        # given
        scanner = GitLabScanner(
            "url", "token", None, [33], [], annotate_latest_commit_id=True
        )
        projects = assemble_projects()
        self.prepare_gitlab_commitlist_mock(mock_gptp, mock_commitmanager)
        # when
        findings = scanner._process_projects(projects)
        # then
        self.assertEqual(2, len(findings), msg="There should be exactly 2 findings")
        self.assertEqual(
            findings[0]["attributes"]["web_url"], "url1", msg=self.wrong_output_msg
        )
        self.assertEqual(
            findings[1]["attributes"]["web_url"], "url2", msg=self.wrong_output_msg
        )
        self.assertEqual(findings[0]["attributes"]["last_commit_id"], "deadbeef")
        mock_gptp.assert_called()
        mock_commitmanager.assert_called()

    @patch("gitlab.v4.objects.ProjectCommitManager.list")
    @patch("git_repo_scanner.gitlab_scanner.GitLabScanner._group_project_to_project")
    def test_process_gitlab_projects_with_ignore_project(
        self, mock_gptp, mock_commitmanager
    ):
        # given
        scanner = GitLabScanner(
            "url", "token", None, [], [1], annotate_latest_commit_id=True
        )
        projects = assemble_projects()
        self.prepare_gitlab_commitlist_mock(mock_gptp, mock_commitmanager)
        # when
        findings = scanner._process_projects(projects)
        # then
        self.assertEqual(2, len(findings), msg="There should be exactly 2 findings")
        self.assertEqual(
            findings[0]["attributes"]["web_url"], "url2", msg=self.wrong_output_msg
        )
        self.assertEqual(
            findings[1]["attributes"]["web_url"], "url3", msg=self.wrong_output_msg
        )
        self.assertEqual(findings[0]["attributes"]["last_commit_id"], "deadbeef")
        mock_gptp.assert_called()
        mock_commitmanager.assert_called()

    @patch("github.Github")
    @patch("github.Organization")
    @patch("github.PaginatedList")
    def test_process_github_repos_with_no_ignore_list(
        self, github_mock, org_mock, pag_mock
    ):
        # given
        scanner = GitHubScanner(
            "url", "token", "org", [], False, annotate_latest_commit_id=True
        )
        repos = assemble_repos()
        create_mocks(github_mock, org_mock, pag_mock, repos)
        scanner._gh = github_mock
        # when
        findings = scanner._process_repos(None, None)
        # then
        org_mock.get_repos.assert_called_with(
            type="all", sort="pushed", direction="asc"
        )
        self.assertEqual(6, len(findings), msg="There should be exactly 6 findings")
        for finding in findings:
            self.assertEqual(finding["name"], "GitHub Repo", msg=self.wrong_output_msg)
            self.assertEqual(finding["attributes"]["last_commit_id"], "deadbeef")

    @patch("github.Github")
    @patch("github.Organization")
    @patch("github.PaginatedList")
    def test_process_github_repos_without_annotating_commit_ids(
        self, github_mock, org_mock, pag_mock
    ):
        # given
        scanner = GitHubScanner(
            "url", "token", "org", [], False, annotate_latest_commit_id=False
        )
        repos = assemble_repos()
        create_mocks(github_mock, org_mock, pag_mock, repos)
        scanner._gh = github_mock
        # when
        findings = scanner._process_repos(None, None)
        # then
        org_mock.get_repos.assert_called_with(
            type="all", sort="pushed", direction="asc"
        )
        self.assertEqual(6, len(findings), msg="There should be exactly 6 findings")
        self.assertTrue(findings[0]["attributes"]["archived"])
        self.assertFalse(findings[1]["attributes"]["archived"])
        self.assertFalse(findings[2]["attributes"]["archived"])
        self.assertTrue(findings[3]["attributes"]["archived"])
        self.assertTrue(findings[4]["attributes"]["archived"])
        self.assertTrue(findings[5]["attributes"]["archived"])
        self.assertEqual(findings[0]["attributes"]["topics"], ["outdated"])
        self.assertEqual(findings[2]["attributes"]["topics"], [])
        for finding in findings:
            self.assertEqual(finding["name"], "GitHub Repo", msg=self.wrong_output_msg)
            self.assertFalse("last_commit_id" in finding["attributes"])

    @patch("github.Github")
    @patch("github.Organization")
    @patch("github.PaginatedList")
    def test_process_github_repos_with_ignore_repos(
        self, github_mock, org_mock, pag_mock
    ):
        # given
        scanner = GitHubScanner(
            "url", "token", "org", [1], False, annotate_latest_commit_id=True
        )
        repos = assemble_repos()
        create_mocks(github_mock, org_mock, pag_mock, repos)
        scanner._gh = github_mock
        # when
        findings = scanner._process_repos(None, None)
        # then
        github_mock.get_organization.assert_called_with("org")
        self.assertEqual(5, len(findings), msg="There should be exactly 5 findings")
        self.assertEqual(findings[0]["attributes"]["last_commit_id"], "deadbeef")

    @patch("github.Github")
    @patch("github.Organization")
    @patch("github.PaginatedList")
    def test_process_github_repos_with_start_time_present(
        self, github_mock, org_mock, pag_mock
    ):
        # given
        scanner = GitHubScanner(
            "url", "token", "org", [], False, annotate_latest_commit_id=True
        )
        repos = assemble_repos()
        print(repos)
        repos.sort(key=lambda r: r.pushed_at, reverse=True)
        create_mocks(github_mock, org_mock, pag_mock, repos)
        scanner._gh = github_mock
        # when
        findings = scanner._process_repos(
            datetime.datetime(2020, 5, 17, tzinfo=timezone.utc), None
        )
        # then
        github_mock.get_organization.assert_called_with("org")
        self.assertEqual(5, len(findings), msg="There should be exactly 5 findings")
        expected_ids = {"1", "2", "3", "4", "6"}
        actual_ids = {finding["attributes"]["id"] for finding in findings}
        self.assertEqual(expected_ids, actual_ids)

    @patch("github.Github")
    @patch("github.Organization")
    @patch("github.PaginatedList")
    def test_process_github_repos_with_end_time_present(
        self, github_mock, org_mock, pag_mock
    ):
        # given
        scanner = GitHubScanner(
            "url", "token", "org", [], False, annotate_latest_commit_id=True
        )
        repos = assemble_repos()

        create_mocks(github_mock, org_mock, pag_mock, repos)
        scanner._gh = github_mock
        # when
        findings = scanner._process_repos(
            None, datetime.datetime(2020, 5, 17, tzinfo=timezone.utc)
        )
        # then
        github_mock.get_organization.assert_called_with("org")
        self.assertEqual(5, len(findings), msg="There should be exactly 5 findings")
        expected_ids = {"1", "2", "3", "4", "5"}
        actual_ids = {finding["attributes"]["id"] for finding in findings}
        self.assertEqual(expected_ids, actual_ids)

    @patch("github.Github")
    @patch("github.Organization")
    @patch("github.PaginatedList")
    def test_process_github_repos_with_start_time_and_end_time_present(
        self, github_mock, org_mock, pag_mock
    ):
        # given
        scanner = GitHubScanner(
            "url", "token", "org", [], False, annotate_latest_commit_id=True
        )
        repos = assemble_repos()
        repos.sort(key=lambda r: r.pushed_at, reverse=True)
        create_mocks(github_mock, org_mock, pag_mock, repos)
        scanner._gh = github_mock
        # when
        findings = scanner._process_repos(
            datetime.datetime(2020, 5, 6, tzinfo=timezone.utc),
            datetime.datetime(2020, 5, 19, tzinfo=timezone.utc),
        )
        # then
        github_mock.get_organization.assert_called_with("org")
        self.assertEqual(4, len(findings), msg="There should be exactly 4 findings")
        expected_ids = {"1", "2", "3", "4"}
        actual_ids = {finding["attributes"]["id"] for finding in findings}
        self.assertEqual(expected_ids, actual_ids)

    def test_setup_github_with_url_and_no_token_should_exit(self):
        # when
        with self.assertRaises(argparse.ArgumentError) as cm:
            GitHubScanner("url", None, "org", [])
        # then
        self.assertEqual(
            cm.exception.args[1],
            "Access token required for GitHub connection.",
            msg="Process should exit",
        )


def get_args(ignore_groups=0, ignore_projects=0, url=None, access_token=None, org=None):
    args = [
        "--git-type",
        "someType",
        "--file-output",
        "out",
        "--obey-rate-limit",
        False,
        "--ignore-repos",
        str(ignore_projects),
        "--ignore-groups",
        str(ignore_groups),
    ]
    if url:
        args.append("--url")
        args.append(url)
    if access_token:
        args.append("--access-token")
        args.append(access_token)
    if org:
        args.append("--organization")
        args.append(org)

    return get_parser_args(args)


def create_mocks(github_mock, org_mock, pag_mock, repos):
    pag_mock.totalCount = 2
    pag_mock.get_page = MagicMock(side_effect=[repos[:3], repos[3:]])
    org_mock.get_repos = MagicMock(return_value=pag_mock)
    github_mock.get_organization = MagicMock(return_value=org_mock)


def assemble_projects():
    created = datetime.datetime(2020, 10, 10, tzinfo=timezone.utc).isoformat()
    updated = datetime.datetime(2020, 11, 10, tzinfo=timezone.utc).isoformat()
    project1 = assemble_project(
        p_id=1,
        name="name1",
        url="url1",
        path="path1",
        date_created=created,
        date_updated=updated,
        visibility="private",
        o_id=11,
        o_kind="group",
        o_name="name11",
    )
    project2 = assemble_project(
        p_id=2,
        name="name2",
        url="url2",
        path="path2",
        date_created=created,
        date_updated=updated,
        visibility="private",
        o_id=22,
        o_kind="user",
        o_name="name22",
    )
    project3 = assemble_project(
        p_id=3,
        name="name3",
        url="url3",
        path="path3",
        date_created=created,
        date_updated=updated,
        visibility="private",
        o_id=33,
        o_kind="group",
        o_name="name33",
        archived=True,
        topics=["outdated"],
    )
    return [project1, project2, project3]


def assemble_project(
    p_id,
    name,
    url,
    path,
    date_created,
    date_updated,
    visibility,
    o_id,
    o_kind,
    o_name,
    archived=False,
    topics=[],
):
    project = Project(ProjectManager(gitlab), {})
    project.id = p_id
    project.name = name
    project.web_url = url
    project.path_with_namespace = path
    project.created_at = date_created
    project.last_activity_at = date_updated
    project.visibility = visibility
    project.namespace = {"kind": o_kind, "id": o_id, "name": o_name}
    project.archived = archived
    project.topics = topics
    return project


def assemble_repos():
    date = datetime.datetime(2020, 5, 17, tzinfo=timezone.utc)
    project1 = assemble_repository(
        p_id=1,
        name="name1",
        url="url1",
        path="path1",
        date_created=date,
        date_updated=date,
        date_pushed=date,
        visibility=True,
        o_id=11,
        o_kind="organization",
        o_name="name11",
    )
    project2 = assemble_repository(
        p_id=2,
        name="name2",
        url="url2",
        path="path2",
        date_created=date,
        date_updated=date,
        date_pushed=date,
        visibility=False,
        o_id=22,
        o_kind="organization",
        o_name="name22",
    )
    project3 = assemble_repository(
        p_id=3,
        name="name3",
        url="url3",
        path="path3",
        date_created=date,
        date_updated=date,
        date_pushed=date,
        visibility=False,
        o_id=33,
        o_kind="organization",
        o_name="name33",
        archived=True,
        topics=["outdated"],
    )

    project4 = assemble_repository(
        p_id=4,
        name="name4",
        url="url4",
        path="path4",
        date_created=datetime.datetime(2020, 5, 5, tzinfo=timezone.utc),
        date_updated=datetime.datetime(2020, 5, 17, tzinfo=timezone.utc),
        date_pushed=datetime.datetime(2020, 5, 17, tzinfo=timezone.utc),
        visibility=False,
        o_id=44,
        o_kind="organization",
        o_name="name44",
        archived=True,
        topics=["outdated"],
    )
    project5 = assemble_repository(
        p_id=5,
        name="name5",
        url="url5",
        path="path5",
        date_created=datetime.datetime(2020, 5, 4, tzinfo=timezone.utc),
        date_updated=datetime.datetime(2020, 5, 4, tzinfo=timezone.utc),
        date_pushed=datetime.datetime(2020, 5, 4, tzinfo=timezone.utc),
        visibility=False,
        o_id=55,
        o_kind="organization",
        o_name="name55",
        archived=True,
        topics=["outdated"],
    )
    project6 = assemble_repository(
        p_id=6,
        name="name6",
        url="url6",
        path="path6",
        date_created=datetime.datetime(2020, 5, 23, tzinfo=timezone.utc),
        date_updated=datetime.datetime(2020, 5, 23, tzinfo=timezone.utc),
        date_pushed=datetime.datetime(2020, 5, 23, tzinfo=timezone.utc),
        visibility=False,
        o_id=66,
        o_kind="organization",
        o_name="name66",
        archived=True,
        topics=["outdated"],
    )
    repos = [project1, project2, project3, project4, project5, project6]
    repos.sort(key=lambda r: r.pushed_at)
    return repos


def assemble_repository(
    p_id,
    name,
    url,
    path,
    date_created: datetime,
    date_updated: datetime,
    date_pushed: datetime,
    visibility: bool,
    o_id,
    o_kind,
    o_name,
    archived=False,
    topics=[],
):

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
    repo.get_commits = lambda: [Mock(sha="deadbeef")]
    repo.get_topics = lambda: topics
    repo.archived = archived
    return repo


class GitHubScannerTimeFrameTests(unittest.TestCase):
    def test_check_repo_is_in_time_frame_in_frame(self):
        # given
        scanner = GitHubScanner(
            "url", "token", "org", [], False, annotate_latest_commit_id=True
        )
        pushed_at = datetime.datetime(2020, 5, 17, tzinfo=timezone.utc)
        start_time = datetime.datetime(2020, 5, 16, tzinfo=timezone.utc)
        end_time = datetime.datetime(2020, 5, 18, tzinfo=timezone.utc)
        # when
        result = scanner._check_repo_is_in_time_frame(pushed_at, start_time, end_time)
        # then
        self.assertTrue(result)

    def test_check_repo_is_in_time_frame_out_of_frame_before(self):
        # given
        scanner = GitHubScanner(
            "url", "token", "org", [], False, annotate_latest_commit_id=True
        )
        pushed_at = datetime.datetime(2020, 5, 15, tzinfo=timezone.utc)
        start_time = datetime.datetime(2020, 5, 16, tzinfo=timezone.utc)
        end_time = datetime.datetime(2020, 5, 18, tzinfo=timezone.utc)
        # when
        result = scanner._check_repo_is_in_time_frame(pushed_at, start_time, end_time)
        # then
        self.assertFalse(result)

    def test_check_repo_is_in_time_frame_out_of_frame_after(self):
        # given
        scanner = GitHubScanner(
            "url", "token", "org", [], False, annotate_latest_commit_id=True
        )
        pushed_at = datetime.datetime(2020, 5, 19, tzinfo=timezone.utc)
        start_time = datetime.datetime(2020, 5, 16, tzinfo=timezone.utc)
        end_time = datetime.datetime(2020, 5, 18, tzinfo=timezone.utc)
        # when
        result = scanner._check_repo_is_in_time_frame(pushed_at, start_time, end_time)
        # then
        self.assertFalse(result)


class GitLabScannerTimeFrameTests(unittest.TestCase):
    @patch("gitlab.Gitlab")
    def test_get_projects_with_time_frame(self, mock_gitlab):
        # given
        scanner = GitLabScanner(
            "url", "token", None, [], [], annotate_latest_commit_id=True
        )
        scanner._gl = mock_gitlab
        start_time = datetime.datetime(2020, 5, 16, tzinfo=timezone.utc)
        end_time = datetime.datetime(2020, 5, 18, tzinfo=timezone.utc)
        # when
        scanner._get_projects(start_time, end_time)
        # then
        mock_gitlab.projects.list.assert_called_with(
            all=True,
            order_by="last_activity_at",
            sort="desc",
            obey_rate_limit=True,
            max_retries=12,
            last_activity_after=start_time,
            last_activity_before=end_time,
        )


if __name__ == "__main__":
    unittest.main()
