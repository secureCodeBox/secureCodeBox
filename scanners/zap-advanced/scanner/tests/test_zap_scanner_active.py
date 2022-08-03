#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

from unittest import TestCase
from unittest.mock import MagicMock, Mock

import pytest
from zapclient.configuration import ZapConfiguration
from zapclient.scanner.zap_scanner_active import ZapConfigureActiveScanner


class ZapConfigurationTests(TestCase):
    @pytest.mark.unit
    def test_has_scan_configurations(self):
        config = ZapConfiguration(
            "./tests/mocks/context-with-overlay/", "https://www.secureCodeBox.io/"
        )
        self.assertIsNone(config.get_active_scanner_config)

        config = ZapConfiguration(
            "./tests/mocks/scan-full-bodgeit-docker/", "http://bodgeit:8080/"
        )
        self.assertIsNotNone(config.get_active_scanner_config)
