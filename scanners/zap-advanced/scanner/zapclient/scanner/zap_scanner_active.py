#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import time
import collections
import logging

from zapv2 import ZAPv2, ascan

from ..configuration import ZapConfiguration
from . import ZapConfigureScanner
from ..configuration.helpers import ZapConfigurationContextUsers

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureActiveScanner')


class ZapConfigureActiveScanner(ZapConfigureScanner):
    """This class configures a scanner in a running ZAP instance, based on a ZAP Configuration.
    
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
        
        super().__init__(zap, config)

    def start_scanner(self, url: str, scanner_config: collections.OrderedDict) -> int:
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        scanner_config: collections.OrderedDict
            The scanner configuration based on a ZapConfiguration.
        """
        scannerId = -1

        # Clear all excisting/previous scanner data
        logging.debug("Cleaning all existing ActiveScans")
        self.get_zap.ascan.remove_all_scans()

        if scanner_config is not None:
            scannerId = self.__start_scanner_with_config(url=url, scanner_config=scanner_config)
        else:
            logging.info("Starting ActiveScan(url='%s') without any additional scanner configuration!", url)
            scannerId = self.get_zap.ascan.scan(url=url, contextid=None)
        
        logging.info("ActiveScan returned: %s", scannerId)

        if not str(scannerId).isdigit() or int(scannerId) < 0:
            logging.error("ActiveScan couldn't be started due to errors: %s", scannerId)
            raise RuntimeError("ActiveScan couldn't be started due to errors: %s", scannerId)
        else:
            logging.info("ActiveScan successfully started with id: %s", scannerId)
            # Give the scanner a chance to start
            time.sleep(5)

            self.wait_until_finished(int(scannerId))

        return scannerId

    def __start_scanner_with_config(self, url: str, scanner_config: collections.OrderedDict) -> int:
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        scanner_config: collections.OrderedDict
            The scanner configuration based on a ZapConfiguration.
        """
        scanner_id = -1
        user_id = None
        context_id = None
        target = None

        if self._is_not_empty("url", scanner_config):
            target = str(scanner_config['url'])
        else:
            logging.warning("The active scanner configuration section has no specific 'url' target defined, trying to use scanType target instead with url: '%s'", url)
            target = url

        # "Context" is an optional config for Scanner
        if self._is_not_empty("context", scanner_config):
        
            scanner_context_config = self.get_config.get_active_context_config
            context_id = int(scanner_context_config['id'])

            # "User" is an optional config for Scanner in addition to the context
            if self._is_not_empty("user", scanner_config):
                user_name = str(scanner_config['user'])
                # search for the configured user by its user name in the active context
                user_id = ZapConfigurationContextUsers.get_context_user_by_name(
                    scanner_context_config,
                    user_name
                )["id"]

        # Configure HTTP ActiveScan
        logging.debug("Trying to configure ActiveScan with %s", scanner_config)
        self.__configure_scanner(self.get_zap.ascan, scanner_config)

        policy = scanner_config["defaultPolicy"]
        if self._is_not_empty_string("policy", scanner_config):
            policy = scanner_config["policy"]

        # ActiveScan with user
        if (context_id is not None) and int(context_id) >= 0 and (user_id is not None) and int(user_id) >= 0:
            logging.info('Starting ActiveScan(url=%s, contextid=%s, userid=%s, scanpolicyname=%s)', target, context_id, user_id, policy)
            scanner_id = self.get_zap.ascan.scan_as_user(url=target, contextid=context_id, userid=user_id, scanpolicyname=policy)
        else:
            logging.info('Starting ActiveScan(url=%s, contextid=%s, scanpolicyname=%s)', target, context_id, policy)
            scanner_id = self.get_zap.ascan.scan(url=target, contextid=context_id, scanpolicyname=policy)
        
        return scanner_id

    def __configure_scanner(self, zap_scanner: ascan, scanner_config: collections.OrderedDict):
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        zap_scanner: ascan
            A reference to the active ZAP scanner (of the running ZAP instance) to configure. 
        scanner_config: collections.OrderedDict
            The scanner configuration based on ZapConfiguration.
        """

        logging.debug('Trying to configure the ActiveScan')
        self.configure_scripts(config=scanner_config)
            
        if self._is_not_empty_integer("maxRuleDurationInMins", scanner_config):
            self.check_zap_result(
                result=zap_scanner.set_option_max_rule_duration_in_mins(integer=str(scanner_config['maxRuleDurationInMins'])), 
                method_name="set_option_max_rule_duration_in_mins"
            )
        if self._is_not_empty_integer("maxScanDurationInMins", scanner_config):
            self.check_zap_result(
                result=zap_scanner.set_option_max_scan_duration_in_mins(integer=str(scanner_config['maxScanDurationInMins'])), 
                method_name="set_option_max_scan_duration_in_mins"
            )
        if self._is_not_empty_integer("threadPerHost", scanner_config):
            self.check_zap_result(
                result=zap_scanner.set_option_thread_per_host(integer=str(scanner_config['threadPerHost'])), 
                method_name="set_option_thread_per_host"
            )
        if self._is_not_empty_integer("delayInMs", scanner_config):
            self.check_zap_result(
                result=zap_scanner.set_option_delay_in_ms(integer=str(scanner_config['delayInMs'])), 
                method_name="set_option_delay_in_ms"
            )
        
        if self._is_not_empty_bool("addQueryParam", scanner_config):
            self.check_zap_result(
                result=zap_scanner.set_option_add_query_param(boolean=str(scanner_config['addQueryParam'])), 
                method_name="set_option_add_query_param"
            )
        if self._is_not_empty_bool("handleAntiCSRFTokens", scanner_config):
            self.check_zap_result(
                result=zap_scanner.set_option_handle_anti_csrf_tokens(boolean=str(scanner_config['handleAntiCSRFTokens'])), 
                method_name="set_option_handle_anti_csrf_tokens"
            )
        if self._is_not_empty_bool("injectPluginIdInHeader", scanner_config):
            self.check_zap_result(
                result=zap_scanner.set_option_inject_plugin_id_in_header(boolean=str(scanner_config['injectPluginIdInHeader'])), 
                method_name="set_option_inject_plugin_id_in_header"
            )
        if self._is_not_empty_bool("scanHeadersAllRequests", scanner_config):
            self.check_zap_result(
                result=zap_scanner.set_option_scan_headers_all_requests(boolean=str(scanner_config['scanHeadersAllRequests'])), 
                method_name="set_option_scan_headers_all_requests"
            )
        if self._is_not_empty_string("defaultPolicy", scanner_config):
            self.check_zap_result(
                result=zap_scanner.set_option_default_policy(string=str(scanner_config['defaultPolicy'])), 
                method_name="set_option_default_policy"
            )
        else:
            # Ensure a defualt value even if nothing is defined
            scanner_config["defaultPolicy"] = "Default Policy"

    def wait_until_finished(self, scanner_id: int):
        """ Wait until the running ZAP ActiveScan finished and log results.
        
        Parameters
        ----------
        scanner_id: int
            The id of the running scanner instance.
        """

        if(scanner_id >= 0):
            while (int(self.get_zap.ascan.status(scanner_id)) < 100):
                logging.info("ActiveScan(%s) progress: %s", scanner_id, self.get_zap.ascan.status(scanner_id))
                time.sleep(1)
                
            logging.info("ActiveScan(%s) completed", scanner_id)
            self.__log_statistics(scanner_id)

    def __log_statistics(self, scanner_id: int):
        # Log a count of the number of urls:
        num_urls = len(self.get_zap.core.urls())
        if num_urls == 0:
            logging.warning("No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container")
        else:
            logging.info("ActiveScan(%s) scanned total: %s site URLs", scanner_id, str(num_urls))
        
        list_of_scans = self.get_zap.ascan.scans
        logging.info("ActiveScan(%s) statistics: %s", scanner_id, list_of_scans)
    
    def get_alerts(self, baseurl, ignore_scan_rules, out_of_scope_dict):
        # Retrieve the alerts using paging in case there are lots of them
        start = 0
        count_per_page = 5000
        alert_dict = {}
        alert_count = 0
        alerts_result = self.get_zap.core.alerts(baseurl=baseurl, start=start, count=count_per_page)
        while len(alerts_result) > 0:
            logging.info('Reading #%s alerts from page: %s', str(count_per_page), str(start))
            alert_count += len(alerts_result)
            for alert in alerts_result:
                plugin_id = str(alert.get('pluginId'))
                # if plugin_id in ignore_scan_rules:
                #     continue
                # if not is_in_scope(plugin_id, alert.get('url'), out_of_scope_dict):
                #     continue
                # if alert.get('risk') == 'Informational':
                #     # Ignore all info alerts - some of them may have been downgraded by security annotations
                #     continue
                if plugin_id not in alert_dict:
                    alert_dict[plugin_id] = []
                alert_dict[plugin_id].append(alert)
            start += count_per_page
            alerts_result = self.get_zap.core.alerts(start=start, count=count_per_page)
        
        logging.info('Total number of alert categories found: #%s with in total #%s alerts.', str(alert_count), alert_count)
        return alert_dict
