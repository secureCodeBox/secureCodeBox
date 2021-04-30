from unittest.mock import MagicMock, Mock
from unittest.mock import patch
from unittest import TestCase


from scbzapv2.zap_configuration import ZapConfiguration

class ZapConfigurationTests(TestCase):

    def test_has_scan_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/")
        self.assertFalse(config.has_scan_configurations())
    
        config = ZapConfiguration("./tests/mocks/scan-full-bodgeit-docker/")
        self.assertTrue(config.has_scan_configurations())
