from unittest.mock import MagicMock, Mock
from unittest.mock import patch
from unittest import TestCase


from scbzapv2.zap_configuration import ZapConfiguration
from scbzapv2.zap_spider import ZapConfigureSpider

class ZapSpiderTests(TestCase):

    def test_has_spider_configurations(self):
        config = ZapConfiguration("./mocks/context-with-overlay/")
        self.assertFalse(config.has_spider_configurations())

        config = ZapConfiguration("./mocks/scan-full-bodgeit/")
        self.assertTrue(config.has_spider_configurations())
