import os
import sys
import time
import json
import requests
import base64
import collections
import logging

from urllib.parse import urlparse
from zapv2 import ZAPv2, spider

from .zap_configuration import ZapConfiguration

class ZapConfigureSpider():
    """This class configures a spider in a running ZAP instance, based on a ZAP Configuration
    
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

    def start_spider_by_target(self, target: str, ajax: bool) -> int:
        """ Starts a ZAP Spider for the given target, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        target: str
            The target to spider.
        """

    def start_spider_by_index(self, index: int, ajax: bool) -> int:
        """ Starts a ZAP Spider with the given index for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The index of the spider object in the list of spider configuration.
        """
        spiderId = -1

        if self.__config.has_spider_configurations:
            logging.debug('Trying to start Spider (Ajax: %s) by configuration index %s', str(ajax), str(index))
            spiderId = self._start_spider(self.__config.get_spider_by_index(index), ajax)
        
        return int(spiderId)

    def start_spider_by_name(self, name: str, ajax: bool) -> int:
        """ Starts a ZAP Spider with the given name for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The name of the spider object in the list of spider configuration.
        """

        if self.__config.has_spider_configurations:
            self._start_spider(self.__config.get_spider_by_name(name))

    def wait_until_finished(self, spider_id: int):
        """ Wait until the running ZAP Spider finished and log results.
        
        Parameters
        ----------
        spider_id: int
            The id of the running spider instance.
        """

        if(spider_id >= 0):
            while (int(self.__zap.spider.status(spider_id)) < 100):
                logging.debug("Spider(%s) progress: %s", str(spider_id), str(self.__zap.spider.status(spider_id)))
                time.sleep(1)
                
                logging.debug("Spider(%s) completed", str(spider_id))

            # Print out a count of the number of urls
            num_urls = len(self.__zap.core.urls())
            if num_urls == 0:
                logging.warning("No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container")
            else:
                logging.info("Spider(%s) found total: %s URLs", str(spider_id), str(num_urls))
                for url in self.__zap.spider.results(scanid=spider_id):
                    logging.info("URL: %s", url)
    
    def _start_spider(self, spider_config: collections.OrderedDict, ajax: bool) -> int:
        """ Starts a ZAP Spider with the given name for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        spider: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        spiderId = -1

        # Clear all excisting/previous spider data
        self.__zap.spider.remove_all_scans()

        # Spider target
        if (ajax):
            logging.debug('Trying to start "ajax" Spider with config: %s', spider_config)
            spiderId = self.___start_spider_ajax(spider_config)
        else:
            logging.debug('Trying to start "traditional" Spider with config: %s', spider_config)
            spiderId = self.__start_spider_http(spider_config)

        if not str(spiderId).isdigit():
            logging.error("Spider couldnt be started due to errors: %s", spiderId)
        else:
            logging.info("Spider successfully started with id: %s", spiderId)
             # Give the scanner a chance to start
            time.sleep(5)

        return spiderId

    def __start_spider_http(self, spider_config: collections.OrderedDict) -> int:
        """ Starts a ZAP Spider with the given name for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        spider: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        spiderId = -1
        spider = self.__zap.spider

        target = spider_config['url']
        context_name = spider_config['context']
        user_name = spider_config['user']
        # search for the current ZAP Context id for the given context name
        spider_context_config = self.__config.get_context_by_name(context_name)
        user_id = self.__config.get_context_user_by_name(spider_context_config, user_name)['id']
        context_id = spider_context_config['id']
        
        self.__zap.core.access_url(target)

        # Configure HTTP Spider
        self.__configure_spider(spider, spider_config)

        # Spider target
        if user_id and int(user_id) >= 0:
            logging.info('Starting traditional Spider(%s) with Context(%s) and User(%s)', target, context_id, user_id)
            spiderId = self.__zap.spider.scan_as_user(url=target, contextid=context_id, userid=user_id)
        else:
            logging.info('Starting traditional Spider(url=%s, contextname=%s)', target, context_name)
            spiderId = self.__zap.spider.scan(url=target, contextname=context_name)
        
        logging.info("Spider returned: %s", spiderId)

        return spiderId
    
    def __start_spider_ajax(self, spider_config: collections.OrderedDict) -> int:
        """ Starts a ZAP Spider with the given name for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        spider: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """

        spiderId = -1
        spider = self.__zap.ajaxSpider
        target = spider_config['url']
        context = spider_config['context']

        # Configure Ajax Spider
        self.__configure_spider(spider, spider_config)

        # Spider target
        
        if scan_user:
            logging.debug('Starting Ajax Spider %s with user %s', target, scan_user['name'])
            spiderId = self.__zap.ajaxSpider.scan_as_user(contextid=context_id, userid=scan_user['id'])
        else:
            logging.debug('Starting Ajax Spider(url=%s, contextname=%s)', target, context)
            spiderId = self.__zap.ajaxSpider.scan(url=target, contextname=context)

        return spiderId

    def __configure_spider(self, zap_spider, spider_config: collections.OrderedDict):
        """ Starts a ZAP Spider with the given name for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        spider: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """

        logging.debug('Trying to configure the Spider')
            
        # Configure Spider (ajax or http)
        
        if "maxDuration" in spider_config and (spider_config['maxDuration'] is not None) and spider_config['maxDuration'] >= 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_max_duration(str(spider_config['maxDuration'])), 
                method="set_option_max_duration"
            )
        if "maxDepth" in spider_config and (spider_config['maxDepth'] is not None) and spider_config['maxDepth'] >= 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_max_depth(str(spider_config['maxDepth'])), 
                method="set_option_max_depth"
            )
        if "maxChildren" in spider_config and (spider_config['maxChildren'] is not None) and spider_config['maxChildren'] >= 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_max_children(str(spider_config['maxChildren'])), 
                method="set_option_max_children"
            )
        if "maxParseSizeBytes" in spider_config and (spider_config['maxParseSizeBytes'] is not None) and spider_config['maxParseSizeBytes'] >= 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_max_parse_size_bytes(str(spider_config['maxParseSizeBytes'])), 
                method="set_option_max_parse_size_bytes"
            )
        if "acceptCookies" in spider_config and (spider_config['acceptCookies'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_accept_cookies(str(spider_config['acceptCookies'])), 
                method="set_option_accept_cookies"
            )
        if "handleODataParametersVisited" in spider_config and (spider_config['handleODataParametersVisited'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_handle_o_data_parameters_visited(str(spider_config['handleODataParametersVisited'])), 
                method="set_option_handle_o_data_parameters_visited"
            )
        if "handleParameters" in spider_config and (spider_config['handleParameters'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_handle_parameters(str(spider_config['handleParameters'])), 
                method="set_option_handle_parameters"
            )
        
        if "parseComments" in spider_config and (spider_config['parseComments'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_comments(str(spider_config['parseComments'])), 
                method="set_option_parse_comments"
            )
        if "parseGit" in spider_config and (spider_config['parseGit'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_git(str(spider_config['parseGit'])), 
                method="set_option_parse_git"
            )
        if "parseRobotsTxt" in spider_config and (spider_config['parseRobotsTxt'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_robots_txt(str(spider_config['parseRobotsTxt'])), 
                method="set_option_parse_robots_txt"
            )
        if "parseSitemapXml" in spider_config and (spider_config['parseSitemapXml'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_sitemap_xml(str(spider_config['parseSitemapXml'])), 
                method="set_option_parse_sitemap_xml"
            )
        if "parseSVNEntries" in spider_config and (spider_config['parseSVNEntries'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_svn_entries(str(spider_config['parseSVNEntries'])), 
                method="set_option_parse_svn_entries"
            )
        if "postForm" in spider_config and (spider_config['postForm'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_post_form(str(spider_config['postForm'])), 
                method="set_option_post_form"
            )
        if "processForm" in spider_config and (spider_config['processForm'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_process_form(str(spider_config['processForm'])), 
                method="set_option_process_form"
            )
        
        if "requestWaitTime" in spider_config and (spider_config['requestWaitTime'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_request_wait_time(str(spider_config['requestWaitTime'])), 
                method="set_option_request_wait_time"
            )
        if "sendRefererHeader" in spider_config and (spider_config['sendRefererHeader'] is not None) :
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_send_referer_header(str(spider_config['sendRefererHeader'])), 
                method="set_option_send_referer_header"
            )
        if "threadCount" in spider_config and (spider_config['threadCount'] is not None) and spider_config['threadCount'] >= 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_thread_count(str(spider_config['threadCount'])), 
                method="set_option_thread_count"
            )
        if "userAgent" in spider_config and (spider_config['userAgent'] is not None) and len(spider_config['userAgent']) > 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_user_agent(string=str(spider_config['userAgent'])), 
                method="set_option_user_agent"
            )
        
    def __check_zap_spider_result(self, spiderId: str, method: str):
        """ Checks the given spiderId for ZAP Errors and logs wariing messages if there are errors returened by ZAP.
        
        Parameters
        ----------
        spiderId: str
            The spiderId of a ZAP Call.
        method: str
            The name of the method used (to call ZAP).
        """
        
        if "OK" != spiderId:
            logging.warn("Failed to configure Spider ['%s'], result is: '%s'", method, spiderId)
        else:
            logging.debug("Successfull configured Spider ['%s'], result is: '%s'", method, spiderId)
