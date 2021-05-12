import pytest

from unittest.mock import MagicMock, Mock
from unittest import TestCase

from scbzapv2.zap_configuration import ZapConfiguration
from scbzapv2.zap_spider_ajax import ZapConfigureSpiderAjax

class ZapSpiderAjaxTests(TestCase):

    @pytest.mark.unit
    def test_has_spider_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/")
        self.assertFalse(config.has_spiders_configurations())

        config = ZapConfiguration("./tests/mocks/scan-full-juiceshop-docker/")
        self.assertTrue(config.has_spiders_configurations())
