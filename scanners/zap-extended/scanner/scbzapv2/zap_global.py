import os
import sys
import time
import json
import requests
import base64
import collections
import logging

from urllib.parse import urlparse
from zapv2 import ZAPv2

from .zap_configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureGlobal')

class ZapConfigureGlobal():
    """This class configures a running ZAP instance, based on a ZAP Global Configuration
    
    Based on this opensource ZAP Python example:
    - https://github.com/zaproxy/zap-api-python/blob/9bab9bf1862df389a32aab15ea4a910551ba5bfc/src/examples/zap_example_api_script.py
    """

    def __init__(self, zap: ZAPv2, config: ZapConfiguration):
        """Initial constructor used for this class
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        config : ZapConfiguration
            The configuration object containing all ZAP configs (based on the class ZapConfiguration).
        """
        
        self.__zap = zap
        self.__config = config

        if self.__config.has_global_configurations:
            global_config = self.__config.get_global()

            if "isNewSession" in global_config and "sessionName" in global_config:
                self.__create_session(str(global_config["sessionName"]))
            else:
                self.__create_session("secureCodeBox")

    def __create_session(self, session_name:str):
        # Start the ZAP session
        logging.info('Creating a new ZAP session with the name: %s', session_name)
        self.__zap.core.new_session(name=session_name, overwrite=True)

        # Wait for ZAP to update the internal caches 
        time.sleep(5)
    
    def _configure_exclude_proxy(self, zap: ZAPv2, global_config: collections.OrderedDict):
        """Protected method to configure the ZAP Global 'Proxy Exclude Settings' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        global_config : collections.OrderedDict
            The current zap gloabl configuration object containing the ZAP Proxy exclude configuration (based on the class ZapConfiguration).
        """

        if "excludeProxyPaths" in global_config:
            for regex in global_config["excludeProxyPaths"]:
                logging.debug("Excluding regex '%s' from global proxy setting", regex)
                zap.core.exclude_from_proxy(regex=regex)

    def __configure_global(self, zap, scanner_config: collections.OrderedDict):
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        zap_scanner: ascan
            A reference to the active ZAP scanner (of the running ZAP instance) to configure. 
        scanner_config: collections.OrderedDict
            The scanner configuration based on ZapConfiguration.
        """

        logging.debug('Trying to configure the ActiveScan')
            
        # Configure ActiveScan (ajax or http)
        
        if "maxRuleDurationInMins" in scanner_config and (scanner_config['maxRuleDurationInMins'] is not None) and scanner_config['maxRuleDurationInMins'] >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_max_rule_duration_in_mins(str(scanner_config['maxRuleDurationInMins'])), 
                method="set_option_max_rule_duration_in_mins"
            )
        if "maxScanDurationInMins" in scanner_config and (scanner_config['maxScanDurationInMins'] is not None) and scanner_config['maxScanDurationInMins'] >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_max_scan_duration_in_mins(str(scanner_config['maxScanDurationInMins'])), 
                method="set_option_max_scan_duration_in_mins"
            )
        if "threadPerHost" in scanner_config and (scanner_config['threadPerHost'] is not None) and scanner_config['threadPerHost'] >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_thread_per_host(str(scanner_config['threadPerHost'])), 
                method="set_option_thread_per_host"
            )
        if "delayInMs" in scanner_config and (scanner_config['delayInMs'] is not None) and scanner_config['delayInMs'] >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_delay_in_ms(str(scanner_config['delayInMs'])), 
                method="set_option_delay_in_ms"
            )
        
        if "addQueryParam" in scanner_config and (scanner_config['addQueryParam'] is not None) :
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_add_query_param(str(scanner_config['addQueryParam'])), 
                method="set_option_add_query_param"
            )
        if "handleAntiCSRFTokens" in scanner_config and (scanner_config['handleAntiCSRFTokens'] is not None) :
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_handle_anti_csrf_tokens(str(scanner_config['handleAntiCSRFTokens'])), 
                method="set_option_handle_anti_csrf_tokens"
            )
        if "injectPluginIdInHeader" in scanner_config and (scanner_config['injectPluginIdInHeader'] is not None) :
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_inject_plugin_id_in_header(str(scanner_config['injectPluginIdInHeader'])), 
                method="set_option_inject_plugin_id_in_header"
            )
        if "scanHeadersAllRequests" in scanner_config and (scanner_config['scanHeadersAllRequests'] is not None) :
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_scan_headers_all_requests(str(scanner_config['scanHeadersAllRequests'])), 
                method="set_option_scan_headers_all_requests"
            )
        
        if "defaultPolicy" in scanner_config and (scanner_config['defaultPolicy'] is not None) and len(scanner_config['defaultPolicy']) >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_default_policy(str(scanner_config['defaultPolicy'])), 
                method="set_option_default_policy"
            )