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

class ZapConfigureActiveScanner():
    """This class configures a scanner in a running ZAP instance, based on a ZAP Configuration
    
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

    def start_scan_by_target(self, target: str) -> int:
        """ Starts a ZAP ActiveScan for the given target, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        target: str
            The target to scanner.
        """

    def start_scan_by_index(self, index: int) -> int:
        """ Starts a ZAP ActiveScan with the given index for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The index of the scanner object in the list of scanners configuration.
        """
        scannerId = -1

        if self.__config.has_scan_configurations:
            logging.debug('Trying to start ActiveScan by configuration index %s', str(index))
            scannerId = self._start_scanner(self.__config.get_scan_by_index(index))
        
        return int(scannerId)

    def start_scan_by_name(self, name: str) -> int:
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The name of the scanner object in the list of scanners configuration.
        """

        if self.__config.has_scan_configurations:
            self._start_scanner(self.__config.get_scans_by_name(name))

    def wait_until_finished(self, scanner_id: int):
        """ Wait until the running ZAP ActiveScan finished and log results.
        
        Parameters
        ----------
        scanner_id: int
            The id of the running scanner instance.
        """

        if(scanner_id >= 0):
            while (int(self.__zap.ascan.status(scanner_id)) < 100):
                logging.debug("ActiveScan(%s) progress: %s", scanner_id, self.__zap.ascan.status(scanner_id))
                time.sleep(1)
                
                logging.debug("ActiveScan(%s) completed", scanner_id)

            # Print out a count of the number of urls
            num_urls = len(self.__zap.core.urls())
            if num_urls == 0:
                logging.warning("No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container")
            else:
                logging.info("ActiveScan(%s) found total: %s URLs", scanner_id, str(num_urls))
    
    def _start_scanner(self, scanner_config: collections.OrderedDict) -> int:
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        scanner: collections.OrderedDict
            The scanner configuration based on ZapConfiguration.
        """
        scannerId = -1
        target = scanner_config['url']
        context = scanner_config['context']

        logging.info("HIER --- Context: %s, ConfigConfig: %s", str(context), str(self.__config.get_context_by_name(context)))
        context_id = self.__config.get_context_by_name(context)['id']

        # Clear all excisting/previous scanner data
        logging.debug("Cleaning all existing ActiveScans")
        self.__zap.ascan.remove_all_scans()
        
        # Configure HTTP ActiveScan
        logging.debug("Trying to configure ActiveScan with %s", scanner_config)
        self.__configure_scanner(self.__zap.ascan, scanner_config)

        # ActiveScan with user
        if False:
            logging.debug('Starting ActiveScan %s with user %s', target, scan_user['name'])
            scannerId = self.__zap.ascan.scan_as_user(contextid=context_id, userid=scan_user['id'])
        else:
            logging.debug('Starting ActiveScan(url=%s, contextid=%s)', target, context_id)
            scannerId = self.__zap.ascan.scan(url=target, contextid=context_id)
        
        logging.info("ActiveScan returned: %s", scannerId)

        if not str(scannerId).isdigit():
            logging.error("ActiveScan couldnt be started due to errors: %s", scannerId)
        else:
            logging.info("ActiveScan successfully started with id: %s", scannerId)
             # Give the scanner a chance to start
            time.sleep(5)

        return scannerId

    def __configure_scanner(self, zap_scanner: ascan, scanner_config: collections.OrderedDict):
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        scanner: collections.OrderedDict
            The scanner configuration based on ZapConfiguration.
        """

        logging.debug('Trying to configure the ActiveScan')
            
        # Configure ActiveScan (ajax or http)
        
        if "maxRuleDurationInMins" in scanner_config and scanner_config['maxRuleDurationInMins'] >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_max_rule_duration_in_mins(str(scanner_config['maxRuleDurationInMins'])), 
                method="set_option_max_rule_duration_in_mins"
            )
        if "maxScanDurationInMins" in scanner_config and scanner_config['maxScanDurationInMins'] >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_max_scan_duration_in_mins(str(scanner_config['maxScanDurationInMins'])), 
                method="set_option_max_scan_duration_in_mins"
            )
        if "threadPerHost" in scanner_config and scanner_config['threadPerHost'] >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_thread_per_host(str(scanner_config['threadPerHost'])), 
                method="set_option_thread_per_host"
            )
        if "delayInMs" in scanner_config and scanner_config['delayInMs'] >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_delay_in_ms(str(scanner_config['delayInMs'])), 
                method="set_option_delay_in_ms"
            )
        
        if "addQueryParam" in scanner_config:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_add_query_param(str(scanner_config['addQueryParam'])), 
                method="set_option_add_query_param"
            )
        if "handleAntiCSRFTokens" in scanner_config:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_handle_anti_csrf_tokens(str(scanner_config['handleAntiCSRFTokens'])), 
                method="set_option_handle_anti_csrf_tokens"
            )
        if "injectPluginIdInHeader" in scanner_config:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_inject_plugin_id_in_header(str(scanner_config['injectPluginIdInHeader'])), 
                method="set_option_inject_plugin_id_in_header"
            )
        if "scanHeadersAllRequests" in scanner_config:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_scan_headers_all_requests(str(scanner_config['scanHeadersAllRequests'])), 
                method="set_option_scan_headers_all_requests"
            )
        
        if "defaultPolicy" in scanner_config and len(scanner_config['defaultPolicy']) >= 0:
            self.__check_zap_scan_result(
                scannerId=zap_scanner.set_option_default_policy(str(scanner_config['defaultPolicy'])), 
                method="set_option_default_policy"
            )
        
    def __check_zap_scan_result(self, scannerId: str, method: str):
        """ Checks the given scannerId for ZAP Errors and logs wariing messages if there are errors returened by ZAP.
        
        Parameters
        ----------
        scannerId: str
            The scannerId of a ZAP Call.
        method: str
            The name of the method used (to call ZAP).
        """
        
        if "OK" != scannerId:
            logging.warn("Failed to configure ActiveScan ['%s'], result is: '%s'", method, scannerId)
        else:
            logging.debug("Successfull configured ActiveScan ['%s'], result is: '%s'", method, scannerId)
