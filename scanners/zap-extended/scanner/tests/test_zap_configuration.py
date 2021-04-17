from unittest.mock import MagicMock, Mock
from unittest.mock import patch
from unittest import TestCase


from scbzapv2.zap_configuration import ZapConfiguration

class ZapConfigurationTests(TestCase):

    def test_always_passes(self):
        self.assertTrue(True)
    
    def test_empty_config_path(self):
        config = ZapConfiguration("")
        self.assertFalse(config.has_context_configurations())
    
    def test_corrupt_config_path(self):
        config = ZapConfiguration("not/existing/path")
        self.assertFalse(config.has_context_configurations())

    def test_existing_config_path(self):
        config = ZapConfiguration("./mocks/configs/context-with-overlay/")
        self.assertTrue(config.has_context_configurations())
    
    def test_empty_config_folder(self):
        config = ZapConfiguration("./mocks/configs/empty/")
        self.assertFalse(config.has_context_configurations())
    
    def test_empty_config_file(self):
        config = ZapConfiguration("./mocks/configs/empty-files/")
        self.assertFalse(config.has_context_configurations())
    
    def test_config_context_without_overlay(self):
        config = ZapConfiguration("./mocks/configs/context-without-overlay/")
        self.assertTrue(config.has_context_configurations())
    
    def test_config_context_with_overlay(self):
        config = ZapConfiguration("./mocks/configs/context-with-overlay/")
        self.assertTrue(config.has_context_configurations())
    
    def test_has_spider_configurations(self):
        config = ZapConfiguration("./mocks/configs/context-with-overlay/")
        self.assertFalse(config.has_spider_configurations())
    
    def test_has_scan_configurations(self):
        config = ZapConfiguration("./mocks/configs/context-with-overlay/")
        self.assertFalse(config.has_scan_configurations())
        


