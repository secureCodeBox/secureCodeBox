#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
import collections
import logging

from zapv2 import ZAPv2, ascan

from .. import ZapClient
from ..configuration import ZapConfiguration
from . import ZapConfigureScanner

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
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

    def start_scan_by_url(self, url: str) -> int:
        """ Starts a ZAP ActiveScan for the given target, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        url: str
            The url to scan with the ZAP active scanner.
        """
        scannerId = -1

        if self.get_config.get_scanners.has_configurations:
            logging.debug("Trying to start ActiveScan by configuration target url: '%s'", str(url))
            # Search for the corresponding context object related to the given url
            context_config=self.get_config.get_contexts.get_configuration_by_url(url)
            # Search for a API configuration referencing the context identified by url
            
            scanner_config=None
            if not context_config == None and "name" in context_config:
                scanner_config=self.get_config.get_scanners.get_configuration_by_context_name(str(context_config["name"]))
            else:
                logging.warning("No context configuration found for target: %s! Starting active scanning without any related context.", url)

            scannerId = self._start_scanner(url=url, scanner_config=scanner_config)
        else:
            logging.warning("There is no scanner configuration section defined in your configuration YAML to start by url: %s.", url)
            scannerId = self._start_scanner(url=url, scanner_config=None)

        return int(scannerId)

    def start_scan_by_index(self, index: int) -> int:
        """ Starts a ZAP ActiveScan with the given index for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The index of the scanner object in the list of scanners configuration.
        """
        scannerId = -1

        if self.get_config.get_scanners.has_configurations:
            logging.debug('Trying to start ActiveScan by configuration index %s', str(index))
            scannerId = self._start_scanner(url=None, scanner_config=self.get_config.get_scanners.get_configuration_by_index(index))
        else:
            logging.warning("There is no scanner configuration section defined in your configuration YAML to start by index: %s.", index)
            scannerId = self._start_scanner(url=None, scanner_config=None)

        return int(scannerId)

    def start_scan_by_name(self, name: str) -> int:
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The name of the scanner object in the list of scanners configuration.
        """
        scannerId = -1

        if self.get_config.get_scanners.has_configurations:
            logging.debug('Trying to start ActiveScan by configuration name %s', str(name))
            scannerId = self._start_scanner(url=None, scanner_config=self.get_config.get_scanners.get_configuration_by_name(name))
        else:
            logging.warning("There is no scanner configuration section defined in your configuration YAML to start by name: %s.", name)
            scannerId = self._start_scanner(url=None, scanner_config=None)

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
                scanner_context_config = self.get_config.get_contexts.get_configuration_by_context_name(context_name)
                context_id = int(scanner_context_config['id'])

                # "User" is an optional config for Scanner in addition to the context
                if("user" in scanner_config):

                    user_name = str(scanner_config['user'])
                    # search for the current ZAP Context id for the given context name
                    user_id = int(self.get_config.get_contexts.get_context_user_by_name(scanner_context_config, user_name)['id'])
        
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
            
        # Configure ActiveScan
        
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
