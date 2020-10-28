import datetime
import unittest
import git_repo_scanner
from munch import Munch
from mock import patch
from mock import MagicMock


class GitRepoScannerTests(unittest.TestCase):

    def test_process_gitlab_projects_with_no_ignore_list(self):
        # given
        projects = assemble_projects()
        args = get_args()
        # when
        findings = git_repo_scanner.process_gitlab_projects(args, projects)
        # then
        self.assertEqual(3, len(findings), msg='There should be exactly 3 findings')
        self.assertEqual(findings[0]['name'], 'GitLab Repo', msg='Test finding output')
        self.assertEqual(findings[1]['name'], 'GitLab Repo', msg='Test finding output')
        self.assertEqual(findings[2]['name'], 'GitLab Repo', msg='Test finding output')

    def test_process_gitlab_projects_with_ignore_group(self):
        # given
        projects = assemble_projects()
        args = get_args(ignore_groups=33)
        # when
        findings = git_repo_scanner.process_gitlab_projects(args, projects)
        # then
        self.assertEqual(2, len(findings), msg='There should be exactly 2 findings')
        self.assertEqual(findings[0]['attributes']['web_url'], 'url1', msg='Test finding output')
        self.assertEqual(findings[1]['attributes']['web_url'], 'url2', msg='Test finding output')

    def test_process_gitlab_projects_with_ignore_project(self):
        # given
        projects = assemble_projects()
        args = get_args(ignore_projects=1)
        # when
        findings = git_repo_scanner.process_gitlab_projects(args, projects)
        # then
        self.assertEqual(2, len(findings), msg='There should be exactly 2 findings')
        self.assertEqual(findings[0]['attributes']['web_url'], 'url2', msg='Test finding output')
        self.assertEqual(findings[1]['attributes']['web_url'], 'url3', msg='Test finding output')

    @patch('github.Github')
    @patch('github.Organization')
    @patch('github.PaginatedList')
    def test_process_github_repos_with_no_ignore_list(self, github_mock, org_mock, pag_mock):
        # given
        repos = assemble_repos()
        create_mocks(github_mock, org_mock, pag_mock, repos)
        args = get_args()
        # when
        findings = git_repo_scanner.process_github_repos(args, github_mock)
        # then
        org_mock.get_repos.assert_called_with(type='all')
        self.assertEqual(6, len(findings), msg='There should be exactly 6 findings')
        for finding in findings:
            self.assertEqual(finding['name'], 'GitHub Repo', msg='Test finding output')

    @patch('github.Github')
    @patch('github.Organization')
    @patch('github.PaginatedList')
    def test_process_github_repos_with_ignore_repos(self, github_mock, org_mock, pag_mock):
        # given
        repos = assemble_repos()
        create_mocks(github_mock, org_mock, pag_mock, repos)
        args = get_args(ignore_projects=1, org='org')
        # when
        findings = git_repo_scanner.process_github_repos(args, github_mock)
        # then
        github_mock.get_organization.assert_called_with('org')
        self.assertEqual(4, len(findings), msg='There should be exactly 4 findings')

    def test_setup_github_with_url_and_no_token_should_exit(self):
        # given
        args = get_args(url='url')
        # when
        with self.assertRaises(SystemExit) as cm:
            git_repo_scanner.setup_github(args)
        # then
        self.assertEqual(cm.exception.code, -1, msg='Process should exit')

    def test_parse_github_with_no_org_should_exit(self):
        # given
        args = get_args()
        # when
        with self.assertRaises(SystemExit) as cm:
            git_repo_scanner.parse_github(args)
        # then
        self.assertEqual(cm.exception.code, -1, msg='Process should exit')


def get_args(ignore_groups=0, ignore_projects=0, url=None, access_token=None, org=None):
    args = ['--git-type', 'gitlab',
            '--file-output', 'out',
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

    return git_repo_scanner.get_parser_args(args)


def create_mocks(github_mock, org_mock, pag_mock, repos):
    pag_mock.totalCount = 2
    pag_mock.get_page = MagicMock(return_value=repos)
    org_mock.get_repos = MagicMock(return_value=pag_mock)
    github_mock.get_organization = MagicMock(return_value=org_mock)


def assemble_projects():
    project1 = assemble_project(1, 'name1', 'url1', 'path1', '10.10.2020',
                                '10.11.2020', 'private', 11, 'group', 'name11')
    project2 = assemble_project(2, 'name2', 'url2', 'path2', '10.10.2020',
                                '10.11.2020', 'private', 22, 'user', 'name22')
    project3 = assemble_project(3, 'name3', 'url3', 'path3', '10.10.2020',
                                '10.11.2020', 'private', 33, 'group', 'name33')
    return [project1, project2, project3]


def assemble_project(p_id, name, url, path, date, date2, visibility, o_id, kind, name2):
    project = Munch()
    project.id = p_id
    project.name = name
    project.web_url = url
    project.path_with_namespace = path
    project.created_at = date
    project.last_activity_at = date2
    project.visibility = visibility
    project.namespace = {
        'kind': kind,
        'id': o_id,
        'name': name2
    }
    return project


def assemble_repos():
    date = datetime.datetime(2020, 5, 17)
    project1 = assemble_repository(1, 'name1', 'url1', 'path1', date,
                                   date, True, 11, 'organization', 'name11')
    project2 = assemble_repository(2, 'name2', 'url2', 'path2', date,
                                   date, False, 22, 'organization', 'name22')
    project3 = assemble_repository(3, 'name3', 'url3', 'path3', date,
                                   date, False, 33, 'organization', 'name33')
    return [project1, project2, project3]


def assemble_repository(p_id, name, url, path, date: datetime, date2: datetime, visibility: bool, o_id, kind, name2):
    repo = Munch()
    repo.id = p_id
    repo.name = name
    repo.html_url = url
    repo.full_name = path
    repo.created_at = date
    repo.updated_at = date2
    repo.private = visibility
    repo.owner = Munch(type=kind, id=o_id, name=name2)
    return repo


if __name__ == '__main__':
    unittest.main()
