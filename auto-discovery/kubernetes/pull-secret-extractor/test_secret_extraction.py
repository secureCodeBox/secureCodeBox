# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

import sys
import unittest

from unittest.mock import MagicMock

# mock kubernetes import so it doesnt need to be installed to run these tests
sys.modules['kubernetes'] = MagicMock()
from secret_extraction import *


class MyTestCase(unittest.TestCase):

    def test_get_raw_secrets(self):
        actual = get_raw_secrets('test_secrets')

        with open('test_secrets/secret_1/.dockerconfigjson') as file:
            expected_secret_1 = json.load(file)

        with open('test_secrets/secret_2/.dockerconfigjson') as file:
            expected_secret_2 = json.load(file)

        # for some reason assertCountEqual doesnt work here
        self.assertIn(expected_secret_1, actual)
        self.assertIn(expected_secret_2, actual)

    def test_get_correct_secret(self):
        with open('test_secrets/secret_1/.dockerconfigjson') as file:
            secret_list = [json.load(file)]

        with open('test_secrets/secret_2/.dockerconfigjson') as file:
            secret_list.append(json.load(file))

        actual = get_correct_secret('localhost:5000', secret_list)

        # testuser:testpassword base64 encoded
        expected = {'auth': 'dGVzdHVzZXI6dGVzdHBhc3N3b3Jk'}

        self.assertCountEqual(expected, actual)

    def test_get_user_and_password_given_auth_string(self):
        secret = {'auth': 'dGVzdHVzZXI6dGVzdHBhc3N3b3Jk'}
        actual = get_user_and_password(secret)

        # testuser, testpassword base64 encoded
        expected = ('dGVzdHVzZXI=', 'dGVzdHBhc3N3b3Jk')

        self.assertEqual(expected, actual)

    def test_get_and_password_given_username_and_password_as_separate_string(self):
        secret = {
            'username': 'dGVzdHVzZXI=',
            'password': 'dGVzdHBhc3N3b3Jk'
        }
        actual = get_user_and_password(secret)

        expected = (secret['username'], secret['password'])
        self.assertEqual(expected, actual)


if __name__ == '__main__':
    unittest.main()
