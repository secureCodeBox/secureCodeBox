#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import time
import collections
import logging

from zapv2 import ZAPv2, ajaxSpider

from ..configuration.helpers import ZapConfigurationContextUsers
from ..configuration import ZapConfiguration
from . import ZapConfigureSpider

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureSpiderAjax')


class ZapConfigureSpiderAjax(ZapConfigureSpider):
    """This class configures a ZAP Ajax Spider in a running ZAP instance, based on a ZAP Configuration.
    
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

    @property
    def get_zap_spider(self) -> ajaxSpider:
        """ Returns the ajax spider of the currently running ZAP instance."""
        return self.get_zap.ajaxSpider

    def start_spider(self, url: str, spider_config: collections.OrderedDict):
        """ Starts a ZAP Spider with the given spiders configuration, based on the internal referenced ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        user_name = None
        context_name = None
        target = ""

        # Clear all existing/previous spider data
        self.get_zap.spider.remove_all_scans()

        # Open first URL before the spider start's to crawl
        self.get_zap.core.access_url(url)

        if spider_config is not None:

            if "url" in spider_config:
                target = str(spider_config['url'])
            else:
                logging.warning("The spider configuration section has no specific 'url' target defined, trying to use scanType target instead with url: '%s'", url)
                target = url

            # Configure Ajax Spider
            self.configure_spider(spider_config)

            # "Context" is an optional config for spider
            if "context" in spider_config:
                context_name = str(spider_config['context'])
                spider_context_config = self.get_config.get_active_context_config

                # "User" is an optional config for spider in addition to the context
                if "user" in spider_config:
                    # this lookup is required as name != username and the ajax spider needs the username
                    user_name = ZapConfigurationContextUsers.get_context_user_by_name(
                        spider_context_config,
                        str(spider_config['user'])
                    )["username"]
            else:
                logging.warning("No context 'context: XYZ' referenced within the spider config. This is ok but maybe not intended.")

            if (context_name is not None) and len(context_name) >= 0 and (user_name is not None) and len(user_name) >= 0:
                logging.info('Starting Ajax Spider(target=%s) with Context(%s) and User(%s)', target, context_name, user_name)
                result = self.get_zap_spider.scan_as_user(url=target, contextname=context_name, username=user_name)
            else:
                logging.debug('Starting Ajax Spider(target=%s) with Context(%s)', target, context_name)
                result = self.get_zap_spider.scan(url=target, contextname=context_name)
        else:
            logging.info("Starting Ajax Spider(target=%s) without any additinal Config!", url)
            result = self.get_zap_spider.scan(url=url, contextname=None)

        if "OK" != str(result):
            logging.error("Spider couldn't be started due to errors: %s", result)
            raise RuntimeError("Spider couldn't be started due to errors: %s", result)
        else:
            # due to the fact that there can be only one ajax spider at once the id is "pinned" to 1
            logging.info("Ajax Spider successfully started!")
            # Give the scanner a chance to start
            time.sleep(5)

            self.wait_until_spider_finished()

    def configure_spider(self, spider_config: collections.OrderedDict):
        """ Configures a ZAP Ajax Spider with the given spider configuration, based on the running ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """

        logging.debug('Trying to configure the AjaxSpider')
        self.configure_scripts(config=spider_config)

        # Configure Spider (ajax or http)

        if self._is_not_empty_integer("maxDuration", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_max_duration(integer=str(spider_config['maxDuration'])),
                method_name="set_option_max_duration"
            )
        if self._is_not_empty_integer("maxDepth", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_max_crawl_depth(integer=str(spider_config['maxDepth'])),
                method_name="set_option_max_crawl_depth"
            )
        if self._is_not_empty_integer("maxStates", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_max_crawl_states(integer=str(spider_config['maxStates'])),
                method_name="set_option_max_crawl_states"
            )
        if self._is_not_empty_string("browserId", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_browser_id(string=str(spider_config['browserId'])),
                method_name="set_option_browser_id"
            )
        if self._is_not_empty_integer("browserCount", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_number_of_browsers(integer=str(spider_config['browserCount'])),
                method_name="set_option_number_of_browsers"
            )
        if self._is_not_empty_integer("randomInputs", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_random_inputs(boolean=str(spider_config['randomInputs'])),
                method_name="set_option_random_inputs"
            )

    def check_if_spider_completed(self):
        finished = self.get_zap_spider.status != 'running'
        logging.info('Ajax Spider running, found urls: %s', self.get_zap_spider.number_of_results)
        return finished

    def print_spider_summary(self):
        """Method to print out a summary of the spider results"""

        logging.info('Ajax Spider complete')

        # Print out a count of the number of urls
        num_urls = len(self.get_zap.core.urls())
        if num_urls == 0:
            logging.error(
                "No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container")
            raise RuntimeError(
                'No URLs found by ZAP Spider :-( - is the target URL accessible? Local services may not be accessible from the Docker container')
        else:
            logging.info("Ajax Spider found total: %s URLs", str(num_urls))
            for url in self.get_zap_spider.results():
                logging.debug("URL: %s", url['requestHeader'])

    def stop_spider(self):
        self.get_zap_spider.stop()