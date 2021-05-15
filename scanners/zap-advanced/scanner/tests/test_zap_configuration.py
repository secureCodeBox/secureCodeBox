#!/usr/bin/env python
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
        config = ZapConfiguration("")
        self.assertFalse(config.get_contexts.has_configurations)
    
    @pytest.mark.unit
    def test_corrupt_config_path(self):
        config = ZapConfiguration("not/existing/path")
        self.assertFalse(config.get_contexts.has_configurations)

    @pytest.mark.unit
    def test_existing_config_path(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/")
        self.assertTrue(config.get_contexts.has_configurations)
    
    @pytest.mark.unit
    def test_empty_config_folder(self):
        config = ZapConfiguration("./tests/mocks/empty/")
        self.assertFalse(config.get_contexts.has_configurations)
    
    @pytest.mark.unit
    def test_empty_config_file(self):
        config = ZapConfiguration("./tests/mocks/empty-files/")
        self.assertFalse(config.get_contexts.has_configurations)
    
    @pytest.mark.unit
    def test_config_context_without_overlay(self):
        config = ZapConfiguration("./tests/mocks/context-without-overlay/")
        self.assertTrue(config.get_contexts.has_configurations)
    
    @pytest.mark.unit
    def test_config_context_with_overlay(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/")
        self.assertTrue(config.get_contexts.has_configurations)
    
    @pytest.mark.unit
    def test_has_spider_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/")
        self.assertTrue(config.get_contexts.has_configurations)
        self.assertFalse(config.get_spiders.has_configurations)

        config = ZapConfiguration("./tests/mocks/scan-full-bodgeit-docker/")
        self.assertTrue(config.get_contexts.has_configurations)
        self.assertTrue(config.get_spiders.has_configurations)
    
    @pytest.mark.unit
    def test_has_scan_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/")
        self.assertTrue(config.get_contexts.has_configurations)
        self.assertFalse(config.get_scanners.has_configurations)
    
        config = ZapConfiguration("./tests/mocks/scan-full-bodgeit-docker/")
        self.assertTrue(config.get_contexts.has_configurations)
        self.assertTrue(config.get_scanners.has_configurations)
        
        
        

