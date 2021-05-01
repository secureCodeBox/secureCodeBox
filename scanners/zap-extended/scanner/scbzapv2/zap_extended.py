import os
import sys
import time
import json
import requests
import base64
import collections
import logging

from urllib.parse import urlparse
from zapv2 import ZAPv2, ascan

from .zap_configuration import ZapConfiguration
from .zap_context import ZapConfigureContext
from .zap_spider import ZapConfigureSpider
from .zap_scanner import ZapConfigureActiveScanner

class ZapExtended:
    """This class configures running ZAP instance
    
    Based on this opensource ZAP Python example:
    - https://github.com/zaproxy/zap-api-python/blob/9bab9bf1862df389a32aab15ea4a910551ba5bfc/src/examples/zap_example_api_script.py
    """

    def __init__(self, zap: ZAPv2, config_dir: str):
        """Initial constructor used for this class
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        config_dir : ZapConfiguration
            The configuration object containing all ZAP configs (based on the class ZapConfiguration).
        """
        
        self.__zap = zap
        self.__config_dir = config_dir

        self.__config = ZapConfiguration(config_dir)

        self.__zap_context = None
        self.__zap_spider = None
        self.__zap_scan = None
    
    def scb_scan(self, target:str):
        
        logging.info('Configuring ZAP Context')
        # Starting to configure the ZAP Instance based on the given Configuration
        if self.__config.has_configurations() and self.__config.has_context_configurations:
            self.__zap_context = ZapConfigureContext(self.__zap, self.__config)

        logging.info('Starting ZAP Spider with target %s', target)
        # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
        if self.__config and self.__config.has_spider_configurations:
            # Starting to configure the ZAP Spider Instance based on the given Configuration
            self.__zap_spider = ZapConfigureSpider(self.__zap, self.__config)
            spider_id = self.__zap_spider.start_spider_by_url(target)

        logging.info('Starting ZAP Scanner with target %s', target)
        # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
        if self.__config and self.__config.has_scan_configurations:
            # Starting to configure the ZAP Instance based on the given Configuration
            self.__zap_scan = ZapConfigureActiveScanner(self.__zap, self.__config)
            # Search for the corresponding context based on the given targetUrl which should correspond to defined the spider url
            scan_id = self.__zap_scan.start_scan_by_url(target)
    
    def get_zap_context(self) -> ZapConfigureContext: 
        return self.__zap_context

    def get_zap_spider(self) -> ZapConfigureSpider:
        return self.__zap_spider

    def get_zap_scan(self) -> ZapConfigureActiveScanner:
        return self.__zap_scan