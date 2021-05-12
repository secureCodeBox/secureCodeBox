import os
import sys
import time
import json
import requests
import base64
import collections
import logging
import time
import errno

from pathlib import Path
from urllib.parse import urlparse
from zapv2 import ZAPv2

from .zap_global import ZapConfigureGlobal
from .zap_configuration import ZapConfiguration
from .zap_context import ZapConfigureContext
from .zap_api import ZapConfigureApi
from .zap_abstract_spider import ZapConfigureSpider
from .zap_spider_http import ZapConfigureSpiderHttp
from .zap_spider_ajax import ZapConfigureSpiderAjax
from .zap_scanner import ZapConfigureActiveScanner

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapExtended')

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

        self.__zap_global = None
        self.__zap_context = None
        self.__zap_api = None
        self.__zap_spider = None
        self.__zap_scan = None
    
    def scb_scan(self, target: str):

        # wait at least 3 minutes for ZAP to start
        self.wait_for_zap_start(3 * 60)
        
        logging.info('Configuring ZAP Global')
        # Starting to configure the ZAP Instance based on the given Configuration
        self.__zap_global = ZapConfigureGlobal(self.__zap, self.__config)
        
        self.zap_tune()
        #self.zap_access_target(target)

        # if target.count('/') > 2:
        #     # The url can include a valid path, but always reset to spider the host
        #     target = target[0:target.index('/', 8)+1]

        logging.info('Configuring ZAP Context')
        # Starting to configure the ZAP Instance based on the given Configuration
        if self.__config.has_configurations() and self.__config.has_contexts_configurations:
            self.__zap_context = ZapConfigureContext(self.__zap, self.__config)
        else:
            logging.info("No ZAP specific YAML configuration found.")

        logging.info('Configuring API Import')
        # Starting to configure the ZAP Instance based on the given Configuration
        if self.__config.has_configurations() and self.__config.has_api_configurations():
            self.__zap_api = ZapConfigureApi(self.__zap, self.__config)
            self.__zap_api.start_api_by_url(target)
        else:
            logging.info("No ZAP API specific YAML configuration found.")

        logging.info('Starting ZAP Spider with target %s', target)
        # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
        if self.__config and self.__config.has_spiders_configurations:
            
            # Starting to configure the ZAP Spider Instance based on the given Configuration
            self.__zap_spider = ZapConfigureSpiderHttp(self.__zap, self.__config)
            self.__zap_spider.start_spider_by_url(target)

            # Additionaly start the ZAP Ajax Spider if enabled
            if self.__zap_spider.is_ajax_spider_enabled():
                self.__zap_spider = ZapConfigureSpiderAjax(self.__zap, self.__config)
                self.__zap_spider.start_spider_by_url(target)
            else:
                logging.info("No ZAP AjaxSpider specific YAML configuration found.")
        else:
            logging.info("No ZAP Spider specific YAML configuration found.")

        # Wait for ZAP to update the internal caches 
        time.sleep(5)

        logging.info('Starting ZAP Scanner with target %s', target)
        # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
        if self.__config and self.__config.has_scans_configurations:
            # Starting to configure the ZAP Instance based on the given Configuration
            self.__zap_scan = ZapConfigureActiveScanner(self.__zap, self.__config)
            # Search for the corresponding context based on the given targetUrl which should correspond to defined the spider url
            scan_id = self.__zap_scan.start_scan_by_url(target)

        else:
            logging.info("No ZAP Scanner specific YAML configuration found.")

    def get_zap_context(self) -> ZapConfigureContext:
        return self.__zap_context

    def get_zap_spider(self) -> ZapConfigureSpider:
        return self.__zap_spider

    def get_zap_scan(self) -> ZapConfigureActiveScanner:
        return self.__zap_scan
    
    def generate_report_file(self, file_path:str, report_type:str):
        # To retrieve ZAP report in XML or HTML format
        logging.info("Creating a new ZAP Report file with type '%s' at location: '%s'", report_type, file_path)
        
        # To retrieve ZAP report in XML or HTML format
        logging.info('Creating a new ZAP Report with type %s', report_type)
        if report_type == None or report_type == "XML":
            # Save the XML report (default)
            self.__write_report(
                self.__zap.core.xmlreport(),
                file_path,
                "xml"
            )
        if report_type == None or report_type == "HTML":
            # Get the HTML report
            self.__write_report(
                self.__zap.core.htmlreport(),
                file_path,
                "html"
            )
        if report_type == None or report_type == "JSON":
            # Get the JSON report
            self.__write_report(
                self.__zap.core.jsonreport(),
                file_path,
                "json"
            )
        if report_type == None or report_type == "MD":
            # Get the Markdown report
            self.__write_report(
                self.__zap.core.mdreport(),
                file_path,
                "md"
            )
    
    def __write_report(self, report, file_path:str, filetype:str):
        Path(file_path).mkdir(parents=True, exist_ok=True)
        with open(f'{file_path}/zap-results.{filetype}', mode='w') as f:
            f.write(report)
    
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

    def zap_tune(self):
        logging.debug('Tune')
        logging.debug('Disable all tags')
        self.__zap.pscan.disable_all_tags()
        logging.debug('Set max pscan alerts')
        self.__zap.pscan.set_max_alerts_per_rule(10)

    def zap_shutdown(self):
        """ This shutdown ZAP and prints out ZAP Scanning stats before shutting down.
        """
        
        logging.info(":: Show all Statistics")
        stats = self.__zap.stats.all_sites_stats()
        logging.info(stats)

        logging.info(":: Shutting down the running ZAP Instance.")
        self.__zap.core.shutdown()
