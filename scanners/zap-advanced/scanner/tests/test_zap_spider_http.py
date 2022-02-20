#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import pytest

from unittest.mock import MagicMock, Mock
from unittest import TestCase

from zapclient.configuration import ZapConfiguration

class ZapSpiderHttpTests(TestCase):

    @pytest.mark.unit
    def test_has_spider_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/", "https://www.secureCodeBox.io/")
        self.assertIsNone(config.get_active_spider_config)

        config = ZapConfiguration("./tests/mocks/scan-full-bodgeit-docker/", "http://bodgeit:8080/")
        self.assertIsNotNone(config.get_active_spider_config)
