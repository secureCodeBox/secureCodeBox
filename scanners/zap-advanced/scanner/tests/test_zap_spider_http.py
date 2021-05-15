#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pytest

from unittest.mock import MagicMock, Mock
from unittest import TestCase

from zapclient.configuration import ZapConfiguration

class ZapSpiderHttpTests(TestCase):

    @pytest.mark.unit
    def test_has_spider_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/")
        self.assertFalse(config.get_spiders.has_configurations)

        config = ZapConfiguration("./tests/mocks/scan-full-bodgeit-docker/")
        self.assertTrue(config.get_spiders.has_configurations)
