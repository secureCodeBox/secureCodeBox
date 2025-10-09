# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

import unittest
from unittest.mock import patch
from pathlib import Path

from git_repo_scanner.__main__ import get_parser_args, process


class MainTests(unittest.TestCase):
    def test_get_parser_args(self):
        args = get_parser_args(
            [
                "--git-type",
                "github",
                "--file-output",
                "mock_file.json",
                "--organization",
                "test-org",
            ]
        )
        self.assertEqual(args.git_type, "github")
        self.assertEqual(
            args.file_output,
            Path("/home/kartu/projects/opensource/secureCodeBox/mock_file.json"),
        )
        self.assertEqual(args.organization, "test-org")

    @patch("git_repo_scanner.github_scanner.GitHubScanner.process")
    def test_process_github(self, mock_process):
        args = get_parser_args(
            [
                "--git-type",
                "github",
                "--file-output",
                "mock_file.json",
                "--organization",
                "test-org",
            ]
        )
        process(args)
        mock_process.assert_called_once()

    @patch("git_repo_scanner.gitlab_scanner.GitLabScanner.process")
    def test_process_gitlab(self, mock_process):
        args = get_parser_args(
            [
                "--git-type",
                "gitlab",
                "--file-output",
                "mock_file.json",
                "--group",
                "123",
                "--url",
                "https://gitlab.com",
                "--access-token",
                "dummy-token",
            ]
        )
        process(args)
        mock_process.assert_called_once()
