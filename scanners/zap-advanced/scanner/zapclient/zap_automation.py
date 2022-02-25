#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import logging
import time
import errno

from pathlib import Path
from zapv2 import ZAPv2

from .configuration import ZapConfiguration
from .settings import ZapConfigureSettings
from .context import ZapConfigureContext
from .api import ZapConfigureApi
from .spider import ZapConfigureSpider, ZapConfigureSpiderHttp, ZapConfigureSpiderAjax
from .scanner import ZapConfigureActiveScanner

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapClient')


class ZapAutomation:
    """This class configures running ZAP instance
    
    Based on this opensource ZAP Python example:
    - https://github.com/zaproxy/zap-api-python/blob/9bab9bf1862df389a32aab15ea4a910551ba5bfc/src/examples/zap_example_api_script.py
    """

    def __init__(self, zap: ZAPv2, config_dir: str, target: str, forced_context: str = None):
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

        self.__config = ZapConfiguration(self.__config_dir, target, forced_context = forced_context)

        self.__zap_scanner = None
    
    @property
    def get_configuration(self) -> ZapConfiguration:
        return self.__config

    @property
    def get_zap_scanner(self) -> ZapConfigureActiveScanner:
        return self.__zap_scanner

    def scan_target(self, target: str):
        # Wait at least 3 minutes for ZAP to start
        self.wait_for_zap_start(3 * 60)
        
        logging.info('Configuring ZAP Global')
        if self.get_configuration.has_global_configurations:
            # Starting to configure the ZAP Instance based on the given Configuration
            zap_settings = ZapConfigureSettings(self.__zap, self.__config)
            zap_settings.configure()
        else:
            logging.info("No ZAP global settings specific YAML configuration found.")
        
        self.zap_tune(target)
        # self.zap_access_target(target)

        logging.info('Configuring ZAP Context')
        # Starting to configure the ZAP Instance based on the given Configuration
        if self.get_configuration.get_active_context_config is not None:
            zap_context = ZapConfigureContext(self.__zap, self.__config)
            zap_context.configure_contexts()
        else:
            logging.info("No ZAP context specific YAML configuration found.")

        self.__start_api_import(target)
        self.__start_spider(target)
        self.__start_scanner(target)

    def __start_api_import(self, target: str):
        logging.info('Configuring API Import')
        # Starting to configure the ZAP Instance based on the given Configuration
        if self.get_configuration.get_active_api_config is not None:
            zap_api = ZapConfigureApi(self.__zap, self.__config)
            zap_api.start_api_import(
                target,
                self.get_configuration.get_active_context_config,
                self.get_configuration.get_active_api_config
            )

            # Wait for ZAP to update the internal caches 
            time.sleep(5)
        else:
            logging.info("No ZAP API specific YAML configuration found.")

    def __start_spider(self, target: str):
        logging.info('Starting ZAP Spider with target %s', target)
        # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
        if self.get_configuration.get_active_spider_config is not None:
            # Starting to configure the ZAP Spider Instance based on the given Configuration
            zap_spider = ZapConfigureSpiderHttp(zap=self.__zap, config=self.__config)
            zap_spider.start_spider_by_url(target)

            # Wait for ZAP to update the internal caches 
            time.sleep(5)

            # Additionaly start the ZAP Ajax Spider if enabled
            if zap_spider.is_ajax_spider_enabled():
                zap_spider = ZapConfigureSpiderAjax(zap=self.__zap, config=self.__config)
                zap_spider.start_spider_by_url(target)

                # Wait for ZAP to update the internal caches 
                time.sleep(5)
            else:
                logging.info("No ZAP AjaxSpider specific YAML configuration found.")
            
        else:
            logging.info("No ZAP Spider specific YAML configuration found. Stating spider without any configuration.")
            zap_spider = ZapConfigureSpiderHttp(zap=self.__zap, config=self.__config)
            zap_spider.start_spider_by_url(target)

    def __start_scanner(self, target: str):
        # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
        if self.get_configuration.get_active_scanner_config is not None:
            logging.info('Starting ZAP Scanner with target %s', target)
        else:
            logging.info("No ZAP Scanner specific YAML configuration found. Stating Active Scanner without any configuration.")
        
        # Starting to configure the ZAP Instance based on the given Configuration
        self.__zap_scanner = ZapConfigureActiveScanner(zap=self.__zap, config=self.__config)
        # Search for the corresponding context based on the given targetUrl which should correspond to defined the spider url
        self.__zap_scanner.start_scan_by_url(target)

    def get_report_template_for_file_type(self, file_type: str):
        if file_type == "XML":
            return "traditional-xml"
        elif file_type == "JSON":
            return "traditional-json"
        elif file_type == "HTML":
            return "traditional-html"
        elif file_type == "MD":
            return "traditional-md"
        else:
            raise RuntimeError(
                "Report file type: '" + file_type + "' hasn't been implemented. Available: XML, JSON, HTML or MD")

    def generate_report_file(self, file_path: str, report_type: str):
        # To retrieve ZAP report in XML or HTML format
        logging.info("Creating a new ZAP Report file with type '%s' at location: '%s'", report_type, file_path)
        
        if report_type is None:
            report_type = "XML"

        report_file = "zap-results." + report_type.lower()
        self.__zap.reports.generate(
            title="ZAP Report",
            template=self.get_report_template_for_file_type(report_type),
            reportdir=file_path,
            contexts=self.__config.get_active_context_config["name"],
            reportfilename=report_file
        )
    
    def wait_for_zap_start(self, timeout_in_secs = 600):
        version = None
        if not timeout_in_secs:
            # if ZAP doesn't start in 10 mins then its probably not going to start
            timeout_in_secs = 600

        for x in range(0, timeout_in_secs):
            try:
                version = self.__zap.core.version
                logging.debug('ZAP Version ' + version)
                logging.debug('Took ' + str(x) + ' seconds')
                break
            except IOError:
                time.sleep(1)

        if not version:
            raise IOError(
            errno.EIO,
            'Failed to connect to ZAP after {0} seconds'.format(timeout_in_secs))

    def zap_access_target(self, target:str):
        logging.info("Testing ZAP Access to target URL: %s", target)
        
        res = self.__zap.urlopen(target)
        if res.startswith("ZAP Error"):
            raise IOError(errno.EIO, 'ZAP failed to access: {0}'.format(target))

    def zap_tune(self, target:str):
        logging.debug('Tune')
        logging.debug('Disable all tags')
        self.__zap.pscan.disable_all_tags()
        logging.debug('Set max pscan alerts')
        self.__zap.pscan.set_max_alerts_per_rule(10)
        if self.get_configuration.get_active_context_config is not None and "includePaths" not in self.get_configuration.get_active_context_config:
            logging.debug("Ensure the target is included in the active context by adding '%s.*' to the includePaths", target)
            self.get_configuration.get_active_context_config["includePaths"] = []
            self.get_configuration.get_active_context_config["includePaths"].append(target + ".*")

    def zap_shutdown(self):
        """ This shutdown ZAP and prints out ZAP Scanning stats before shutting down.
        """
        
        logging.info(":: Show all Statistics")
        stats = self.__zap.stats.all_sites_stats()
        logging.info(stats)

        logging.info(":: Shutting down the running ZAP Instance.")
        self.__zap.core.shutdown()
