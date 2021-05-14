import pytest

from unittest.mock import MagicMock, Mock
from unittest import TestCase

from zapclient.zap_configuration import ZapConfiguration
from zapclient.zap_scanner_active import ZapConfigureActiveScanner

class ZapConfigurationTests(TestCase):

    @pytest.mark.unit
    def test_has_scan_configurations(self):
        config = ZapConfiguration("./tests/mocks/context-with-overlay/")
        self.assertFalse(config.has_scans_configurations())
    
        config = ZapConfiguration("./tests/mocks/scan-full-bodgeit-docker/")
        self.assertTrue(config.has_scans_configurations())
