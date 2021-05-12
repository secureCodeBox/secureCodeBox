import pytest

from unittest.mock import MagicMock, Mock
from unittest import TestCase

from scbzapv2.zap_configuration import ZapConfiguration
from scbzapv2.zap_context import ZapConfigureContext

class ZapScannerTests(TestCase):

    @pytest.mark.unit
    def test_always_passes(self):
        self.assertTrue(True)

