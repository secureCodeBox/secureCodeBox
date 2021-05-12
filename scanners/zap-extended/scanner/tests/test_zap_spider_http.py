import pytest

from unittest.mock import MagicMock, Mock
from unittest import TestCase

from scbzapv2.zap_configuration import ZapConfiguration
from scbzapv2.zap_spider_http import ZapConfigureSpider

class ZapSpiderHttpTests(TestCase):

    @pytest.mark.unit
    def test_has_spider_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/")
        self.assertFalse(config.has_spiders_configurations())

        config = ZapConfiguration("./tests/mocks/scan-full-bodgeit-docker/")
        self.assertTrue(config.has_spiders_configurations())
