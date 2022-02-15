#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import pytest

from unittest.mock import MagicMock, Mock
from unittest import TestCase

from zapclient.configuration.zap_configuration import ZapConfiguration

class ZapConfigurationTests(TestCase):

    @pytest.mark.unit
    def test_always_passes(self):
        self.assertTrue(True)
    
    @pytest.mark.unit
    def test_empty_config_path(self):
        config = ZapConfiguration("", "https://example.com")
        self.assertIsNone(config.get_active_context_config)

    @pytest.mark.unit
    def test_corrupt_config_path(self):
        config = ZapConfiguration("not/existing/path", "https://example.com")
        self.assertIsNone(config.get_active_context_config)

    @pytest.mark.unit
    def test_existing_config_path(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/", "https://www.secureCodeBox.io/")
        self.assertIsNotNone(config.get_active_context_config)
    
    @pytest.mark.unit
    def test_empty_config_folder(self):
        config = ZapConfiguration("./tests/mocks/empty/", "https://www.secureCodeBox.io/")
        self.assertIsNone(config.get_active_context_config)
    
    @pytest.mark.unit
    def test_empty_config_file(self):
        config = ZapConfiguration("./tests/mocks/empty-files/", "https://www.secureCodeBox.io/")
        self.assertIsNone(config.get_active_context_config)
    
    @pytest.mark.unit
    def test_config_context_without_overlay(self):
        config = ZapConfiguration("./tests/mocks/context-without-overlay/", "https://www.secureCodeBox.io/")
        self.assertIsNotNone(config.get_active_context_config)
    
    @pytest.mark.unit
    def test_config_context_with_overlay(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/", "https://www.secureCodeBox.io/")
        self.assertIsNotNone(config.get_active_context_config)

    @pytest.mark.unit
    def test_returns_the_current_context_correctly(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/", "https://www.secureCodeBox.io/")
        context = config.get_active_context_config
        self.assertIsNotNone(context)
        self.assertEqual(context["name"], "secureCodeBoxScanType-NoAuth")
    
    @pytest.mark.unit
    def test_has_spider_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/", "https://www.secureCodeBox.io/")
        self.assertIsNotNone(config.get_active_context_config)
        self.assertIsNone(config.get_active_spider_config)

        config = ZapConfiguration("./tests/mocks/scan-full-bodgeit-docker/", "http://bodgeit:8080/bodgeit/")
        self.assertIsNotNone(config.get_active_context_config)
        self.assertIsNotNone(config.get_active_spider_config)
    
    @pytest.mark.unit
    def test_has_scan_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/", "https://www.secureCodeBox.io/")
        self.assertIsNotNone(config.get_active_context_config)
        self.assertIsNone(config.get_active_spider_config)
    
        config = ZapConfiguration("./tests/mocks/scan-full-bodgeit-docker/", "http://bodgeit:8080/bodgeit/")
        self.assertIsNotNone(config.get_active_context_config)
        self.assertIsNotNone(config.get_active_spider_config)

    @pytest.mark.unit
    def test_has_scan_configurations(self):
        config = ZapConfiguration(
            "./tests/mocks/context-using-forced-context/",
            "http://test.example.com",
            forced_context="scb-test-context")
        self.assertIsNotNone(config.get_active_context_config)
        self.assertEqual("scb-test-context", config.get_active_context_config["name"])

        self.assertIsNotNone(config.get_active_spider_config)
        self.assertEqual("scb-test-spider", config.get_active_spider_config["name"])

        self.assertIsNotNone(config.get_active_scanner_config)
        self.assertEqual("scb-test-scanner", config.get_active_scanner_config["name"])
