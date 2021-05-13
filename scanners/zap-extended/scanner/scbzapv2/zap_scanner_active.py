#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
import collections
import logging

from urllib.parse import urlparse
from zapv2 import ZAPv2, ascan

from .zap_abstract_scanner import ZapConfigureScanner
from .zap_configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureActiveScanner')

class ZapConfigureActiveScanner(ZapConfigureScanner):
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
        
        super().__init__(zap, config)

    def start_scan_by_url(self, url: str) -> int:
        """ Starts a ZAP ActiveScan for the given target, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        url: str
            The url to scan with the ZAP active scanner.
        """
        scannerId = -1

        if self.get_config.has_scans_configurations:
            logging.debug("Trying to start ActiveScan by configuration target url: '%s'", str(url))

            context=self.get_config.get_context_by_url(url)

            scanner_config=None
            if not context == None and "name" in context:
                scanner_config=self.get_config.get_scan_by_context_name(str(context["name"]))
            else:
                logging.warning("No context configuration found for target: %s! Starting active scanning without any related context.", url)

            scannerId = self._start_scanner(url=url, scanner_config=scanner_config)
        else:
            logging.error("There is no scanner specific configuration found.")
            scannerId = self._start_scanner(url=url)

        return int(scannerId)

    def start_scan_by_index(self, index: int) -> int:
        """ Starts a ZAP ActiveScan with the given index for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The index of the scanner object in the list of scanners configuration.
        """
        scannerId = -1

        if self.get_config.has_scans_configurations:
            logging.debug('Trying to start ActiveScan by configuration index %s', str(index))
            scannerId = self._start_scanner(self.get_config.get_scan_by_index(index))
        
        return int(scannerId)

    def start_scan_by_name(self, name: str) -> int:
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The name of the scanner object in the list of scanners configuration.
        """
        scannerId = -1

        if self.get_config.has_scans_configurations:
            logging.debug('Trying to start ActiveScan by configuration name %s', str(name))
            scannerId = self._start_scanner(self.get_config.get_scans_by_name(name))
        
        return int(scannerId)

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

            # Print out a count of the number of urls
            num_urls = len(self.get_zap.core.urls())
            if num_urls == 0:
                logging.warning("No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container")
            else:
                logging.info("ActiveScan(%s) found total: %s URLs", scanner_id, str(num_urls))
    
    def _start_scanner(self, url: str, scanner_config: collections.OrderedDict) -> int:
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        scanner_config: collections.OrderedDict
            The scanner configuration based on a ZapConfiguration.
        """
        scannerId = -1
        user_id = None
        context_id = None
        target = None

        # Clear all excisting/previous scanner data
        logging.debug("Cleaning all existing ActiveScans")
        self.get_zap.ascan.remove_all_scans()

        if not scanner_config == None:

            if("url" in scanner_config):
                target = str(scanner_config['url'])
            else:
                logging.warning("The active scanner configuration section has no specific 'url' target defined, trying to use scanType target instead with url: '%s'", url)
                target=url

            # "Context" is an optional config for Scanner
            if("context" in scanner_config):
            
                context_name = str(scanner_config['context'])
                scanner_context_config = self.get_config.get_context_by_name(context_name)
                context_id = int(scanner_context_config['id'])

                # "User" is an optional config for Scanner in addition to the context
                if("user" in scanner_config):

                    user_name = str(scanner_config['user'])
                    # search for the current ZAP Context id for the given context name
                    user_id = int(self.get_config.get_context_user_by_name(scanner_context_config, user_name)['id'])
        
            # Configure HTTP ActiveScan
            logging.debug("Trying to configure ActiveScan with %s", scanner_config)
            self.__configure_scanner(self.get_zap.ascan, scanner_config)

            # ActiveScan with user
            if (not context_id is None) and context_id >= 0 and (not user_id is None) and user_id >= 0:
                logging.debug('Starting ActiveScan(url=%s, contextid=%s, userid=%s)', target, context_id, user_id)
                scannerId = self.get_zap.ascan.scan_as_user(url=target, contextid=context_id, userid=user_id)
            else:
                logging.debug('Starting ActiveScan(url=%s, contextid=%s)', target, context_id)
                scannerId = self.get_zap.ascan.scan(url=target, contextid=context_id)
        else:
            logging.info("Starting ActiveScan(url='%s') without any additinal scanner configuration!", url)
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

    def get_alerts(self, baseurl, ignore_scan_rules, out_of_scope_dict):
        # Retrieve the alerts using paging in case there are lots of them
        st = 0
        pg = 5000
        alert_dict = {}
        alert_count = 0
        alerts = self.get_zap.core.alerts(baseurl=baseurl, start=st, count=pg)
        while len(alerts) > 0:
            logging.debug('Reading ' + str(pg) + ' alerts from ' + str(st))
            alert_count += len(alerts)
            for alert in alerts:
                plugin_id = alert.get('pluginId')
                # if plugin_id in ignore_scan_rules:
                #     continue
                # if not is_in_scope(plugin_id, alert.get('url'), out_of_scope_dict):
                #     continue
                # if alert.get('risk') == 'Informational':
                #     # Ignore all info alerts - some of them may have been downgraded by security annotations
                #     continue
                if (plugin_id not in alert_dict):
                    alert_dict[plugin_id] = []
                alert_dict[plugin_id].append(alert)
            st += pg
            alerts = self.get_zap.core.alerts(start=st, count=pg)
        logging.debug('Total number of alerts: ' + str(alert_count))
        return alert_dict
    
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
            
        # Configure ActiveScan (ajax or http)
        
        if "maxRuleDurationInMins" in scanner_config and (scanner_config['maxRuleDurationInMins'] is not None) and scanner_config['maxRuleDurationInMins'] >= 0:
            self.check_zap_result(
                result=zap_scanner.set_option_max_rule_duration_in_mins(str(scanner_config['maxRuleDurationInMins'])), 
                method="set_option_max_rule_duration_in_mins"
            )
        if "maxScanDurationInMins" in scanner_config and (scanner_config['maxScanDurationInMins'] is not None) and scanner_config['maxScanDurationInMins'] >= 0:
            self.check_zap_result(
                result=zap_scanner.set_option_max_scan_duration_in_mins(str(scanner_config['maxScanDurationInMins'])), 
                method="set_option_max_scan_duration_in_mins"
            )
        if "threadPerHost" in scanner_config and (scanner_config['threadPerHost'] is not None) and scanner_config['threadPerHost'] >= 0:
            self.check_zap_result(
                result=zap_scanner.set_option_thread_per_host(str(scanner_config['threadPerHost'])), 
                method="set_option_thread_per_host"
            )
        if "delayInMs" in scanner_config and (scanner_config['delayInMs'] is not None) and scanner_config['delayInMs'] >= 0:
            self.check_zap_result(
                result=zap_scanner.set_option_delay_in_ms(str(scanner_config['delayInMs'])), 
                method="set_option_delay_in_ms"
            )
        
        if "addQueryParam" in scanner_config and (scanner_config['addQueryParam'] is not None) :
            self.check_zap_result(
                result=zap_scanner.set_option_add_query_param(str(scanner_config['addQueryParam'])), 
                method="set_option_add_query_param"
            )
        if "handleAntiCSRFTokens" in scanner_config and (scanner_config['handleAntiCSRFTokens'] is not None) :
            self.check_zap_result(
                result=zap_scanner.set_option_handle_anti_csrf_tokens(str(scanner_config['handleAntiCSRFTokens'])), 
                method="set_option_handle_anti_csrf_tokens"
            )
        if "injectPluginIdInHeader" in scanner_config and (scanner_config['injectPluginIdInHeader'] is not None) :
            self.check_zap_result(
                result=zap_scanner.set_option_inject_plugin_id_in_header(str(scanner_config['injectPluginIdInHeader'])), 
                method="set_option_inject_plugin_id_in_header"
            )
        if "scanHeadersAllRequests" in scanner_config and (scanner_config['scanHeadersAllRequests'] is not None) :
            self.check_zap_result(
                result=zap_scanner.set_option_scan_headers_all_requests(str(scanner_config['scanHeadersAllRequests'])), 
                method="set_option_scan_headers_all_requests"
            )
        
        if "defaultPolicy" in scanner_config and (scanner_config['defaultPolicy'] is not None) and len(scanner_config['defaultPolicy']) >= 0:
            self.check_zap_result(
                result=zap_scanner.set_option_default_policy(str(scanner_config['defaultPolicy'])), 
                method="set_option_default_policy"
            )
