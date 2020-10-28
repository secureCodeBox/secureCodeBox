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
  project1 = assemble_project(p_id=1, name='name1', url='url1', path='path1', date_created='10.10.2020',
                              date_updated='10.11.2020', visibility='private', o_id=11, o_kind='group',
                              o_name='name11')
  project2 = assemble_project(p_id=2, name='name2', url='url2', path='path2', date_created='10.10.2020',
                              date_updated='10.11.2020', visibility='private', o_id=22, o_kind='user',
                              o_name='name22')
  project3 = assemble_project(p_id=3, name='name3', url='url3', path='path3', date_created='10.10.2020',
                              date_updated='10.11.2020', visibility='private', o_id=33, o_kind='group',
                              o_name='name33')
  return [project1, project2, project3]


def assemble_project(p_id, name, url, path, date_created, date_updated, visibility, o_id, o_kind, o_name):
  project = Munch()
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
  date = datetime.datetime(2020, 5, 17)
  project1 = assemble_repository(p_id=1, name='name1', url='url1', path='path1', date_created=date,
                                 date_updated=date, visibility=True, o_id=11, o_kind='organization',
                                 o_name='name11')
  project2 = assemble_repository(p_id=2, name='name2', url='url2', path='path2', date_created=date,
                                 date_updated=date, visibility=False, o_id=22, o_kind='organization',
                                 o_name='name22')
  project3 = assemble_repository(p_id=3, name='name3', url='url3', path='path3', date_created=date,
                                 date_updated=date, visibility=False, o_id=33, o_kind='organization',
                                 o_name='name33')
  return [project1, project2, project3]


def assemble_repository(p_id, name, url, path, date_created: datetime, date_updated: datetime, visibility: bool, o_id,
                        o_kind, o_name):
  repo = Munch()
  repo.id = p_id
  repo.name = name
  repo.html_url = url
  repo.full_name = path
  repo.created_at = date_created
  repo.updated_at = date_updated
  repo.private = visibility
  repo.owner = Munch(type=o_kind, id=o_id, name=o_name)
  return repo


if __name__ == '__main__':
  unittest.main()
