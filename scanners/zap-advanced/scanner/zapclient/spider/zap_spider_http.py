#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import time
import collections
import logging

from zapv2 import ZAPv2, spider

from ..configuration import ZapConfiguration
from . import ZapConfigureSpider

# set up logging to file - see previous section for more details
from ..configuration.helpers import ZapConfigurationContextUsers

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureSpiderHttp')


class ZapConfigureSpiderHttp(ZapConfigureSpider):
    """This class configures a ZAP HTTP Spider in a running ZAP instance, based on a ZAP Configuration.
    
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
        self.__spider_id = -1
        
        super().__init__(zap, config)

    @property
    def get_zap_spider(self) -> spider:
        """ Returns the spider of the currently running ZAP instance."""
        return self.get_zap.spider
    
    @property
    def get_spider_id(self) -> int:
        """ Returns the spider id of the currently running ZAP instance."""
        return self.__spider_id
    
    def has_spider_id(self) -> bool:
        """ Returns a spider is currently running in the ZAP instance."""
        return self.__spider_id > 0
    
    def start_spider(self, url: str, spider_config: collections.OrderedDict):
        """ Starts a ZAP Spider with the given spiders configuration, based on the internal referenced ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        user_id = None
        context_id = None
        context_name = None
        target = ""

        # Clear all existing/previous spider data
        logging.debug("Removing all pre existing spider scans.")     
        self.get_zap.spider.remove_all_scans()

        # Open first URL before the spider start's to crawl
        self.get_zap.core.access_url(url)

        if spider_config is not None:

            if("url" in spider_config):
                target = str(spider_config['url'])
            else:
                logging.warning("The spider configuration section has no specific 'url' target defined, trying to use scanType target instead with url: '%s'", url)
                target=url

            # Configure Spider Options if there are any
            self.configure_spider(spider_config)

            # "Context" is an optional config for spider
            if self._is_not_empty("context", spider_config):
            
                context_name = str(spider_config['context'])
                spider_context_config = self.get_config.get_active_context_config
                context_id = int(spider_context_config['id'])

                # "User" is an optional config for spider in addition to the context
                if self._is_not_empty("user", spider_config):
                    user_name = str(spider_config['user'])
                    # search for the configured user by its user name in the active context
                    user_id = ZapConfigurationContextUsers.get_context_user_by_name(
                        spider_context_config,
                        user_name
                    )["id"]
            else:
                logging.warning("No context 'context: XYZ' referenced within the spider config. This is ok but maybe not intended.")

            logging.warning("context_id is currently: %s", context_id)
            logging.warning("user_id is currently: %s", user_id)
            if (context_id is not None) and int(context_id) >= 0 and (user_id is not None) and int(user_id) >= 0:
                logging.info("Starting 'traditional' Spider(target=%s) with Context(%s) and User(%s)", target, context_id, user_id)
                result = self.get_zap_spider.scan_as_user(url=target, contextid=context_id, userid=user_id)
            else:
                logging.info("Starting 'traditional' Spider(target=%s) with Context(%s)", target, context_name)
                result = self.get_zap_spider.scan(url=target, contextname=context_name)
        else:
            logging.info("Starting 'traditional' Spider(target=%s) without any additinal configuration!", url)
            result = self.get_zap_spider.scan(url=url, contextname=None)
        
        # Check if spider is running successfully
        if (not str(result).isdigit()) or int(result) < 0:
            logging.error("Spider couldn't be started due to errors: %s", result)
            raise RuntimeError("Spider couldn't be started due to errors: %s", result)
        else:
            logging.info("HTTP Spider successfully started with id: %s", result)
            self.__spider_id = int(result)
            # Give the scanner a chance to start
            time.sleep(5)

            self.wait_until_spider_finished()
    
    def configure_spider(self, spider_config: collections.OrderedDict):
        """ Configures a ZAP HTTP Spider with the given spider configuration, based on the running ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """

        logging.debug('Trying to configure the Spider')
        self.configure_scripts(config=spider_config)
        
        # Configure Spider (ajax or http)
        
        if self._is_not_empty_integer("maxDuration", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_max_duration(integer=str(spider_config['maxDuration'])), 
                method_name="set_option_max_duration"
            )
        if self._is_not_empty_integer("maxDepth", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_max_depth(integer=str(spider_config['maxDepth'])), 
                method_name="set_option_max_depth"
            )
        if self._is_not_empty_integer("maxChildren", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_max_children(integer=str(spider_config['maxChildren'])), 
                method_name="set_option_max_children"
            )
        if self._is_not_empty_integer("maxParseSizeBytes", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_max_parse_size_bytes(integer=str(spider_config['maxParseSizeBytes'])), 
                method_name="set_option_max_parse_size_bytes"
            )
        if self._is_not_empty_bool("acceptCookies", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_accept_cookies(boolean=str(spider_config['acceptCookies'])), 
                method_name="set_option_accept_cookies"
            )
        if self._is_not_empty_bool("handleODataParametersVisited", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_handle_o_data_parameters_visited(boolean=str(spider_config['handleODataParametersVisited'])), 
                method_name="set_option_handle_o_data_parameters_visited"
            )
        if self._is_not_empty_bool("handleParameters", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_handle_parameters(string=str(spider_config['handleParameters'])), 
                method_name="set_option_handle_parameters"
            )
        
        if self._is_not_empty_bool("parseComments", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_parse_comments(boolean=str(spider_config['parseComments'])), 
                method_name="set_option_parse_comments"
            )
        if self._is_not_empty_bool("parseGit", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_parse_git(boolean=str(spider_config['parseGit'])), 
                method_name="set_option_parse_git"
            )
        if self._is_not_empty_bool("parseRobotsTxt", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_parse_robots_txt(boolean=str(spider_config['parseRobotsTxt'])), 
                method_name="set_option_parse_robots_txt"
            )
        if self._is_not_empty_bool("parseSitemapXml", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_parse_sitemap_xml(boolean=str(spider_config['parseSitemapXml'])), 
                method_name="set_option_parse_sitemap_xml"
            )
        if self._is_not_empty_bool("parseSVNEntries", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_parse_svn_entries(boolean=str(spider_config['parseSVNEntries'])), 
                method_name="set_option_parse_svn_entries"
            )
        if self._is_not_empty_bool("postForm", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_post_form(boolean=str(spider_config['postForm'])), 
                method_name="set_option_post_form"
            )
        if self._is_not_empty_bool("processForm", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_process_form(boolean=str(spider_config['processForm'])), 
                method_name="set_option_process_form"
            )
        
        if self._is_not_empty_integer("requestWaitTime", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_request_wait_time(integer=str(spider_config['requestWaitTime'])), 
                method_name="set_option_request_wait_time"
            )
        if self._is_not_empty_bool("sendRefererHeader", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_send_referer_header(boolean=str(spider_config['sendRefererHeader'])), 
                method_name="set_option_send_referer_header"
            )
        if self._is_not_empty_integer("threadCount", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_thread_count(integer=str(spider_config['threadCount'])), 
                method_name="set_option_thread_count"
            )
        if self._is_not_empty_string("userAgent", spider_config):
            self.check_zap_result(
                result=self.get_zap_spider.set_option_user_agent(string=str(spider_config['userAgent'])), 
                method_name="set_option_user_agent"
            )

    def check_if_spider_completed(self):
        progress = int(self.get_zap_spider.status(self.get_spider_id))
        logging.info("HTTP Spider(%d) progress: %d", self.get_spider_id, progress)
        return progress >= 100

    def print_spider_summary(self):
        """Method to print out a summary of the spider results"""
        logging.info("HTTP Spider(%s) completed", str(self.get_spider_id))

        num_urls = len(self.get_zap.core.urls())
        if num_urls == 0:
            logging.error("No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container.")
            raise RuntimeError('No URLs found by ZAP Spider :-( - is the target URL accessible? Local services may not be accessible from the Docker container.')
        else:
            for url in self.get_zap_spider.results(scanid=self.get_spider_id):
                logging.info("Spidered URL: %s", url)
            logging.info("Spider(%s) found total: %s URLs", str(self.get_spider_id), str(num_urls))

    def stop_spider(self):
        self.get_zap_spider.stop()
