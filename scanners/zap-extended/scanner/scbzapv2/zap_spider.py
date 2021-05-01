import os
import sys
import time
import json
import requests
import base64
import collections
import logging

from urllib.parse import urlparse
from zapv2 import ZAPv2, spider, ajaxSpider

from .zap_configuration import ZapConfiguration

class ZapConfigureSpider:
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

    def start_spider_by_url(self, url: str) -> int:
        """ Starts a ZAP Spider for the given url, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        url: str
            The url to spider.
        ajax: bool
            True if the ajax spider must be used instead of the traditional spider, otherwise false.
        """
        spiderId = -1
        ajax_config=False

        if self.__config.has_spider_configurations:

            context=self.__config.get_context_by_url(url)

            spider_config=None
            if "name" in context:
                spider_config = self.__config.get_spider_by_context_name(str(context["name"]))
                ajax = True if "ajax" in spider_config else False

            logging.info('Trying to start Spider (Ajax: %s) by configuration target url %s', str(ajax), url)
            spiderId = self._start_spider(spider_config=spider_config, ajax=ajax_config)
        else:
            logging.error("There is no spider specific configuration found.")

        
        return int(spiderId)

    def start_spider_by_index(self, index: int) -> int:
        """ Starts a ZAP Spider with the given index for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The index of the spider object in the list of spider configuration.
        ajax: bool
            True if the ajax spider must be used instead of the traditional spider, otherwise false.
        """
        spiderId = -1
        ajax_config=False

        if self.__config.has_spider_configurations:
            spider_config = self.__config.get_spider_by_index(index)
            ajax = True if "ajax" in spider_config else False

            logging.debug('Trying to start Spider (Ajax: %s) by configuration index %s', str(ajax), str(index))
            spiderId = self._start_spider(spider_config=spider_config, ajax=ajax)
        
        return int(spiderId)

    def start_spider_by_name(self, name: str) -> int:
        """ Starts a ZAP Spider with the given name for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The name of the spider object in the list of spider configuration.
        ajax: bool
            True if the ajax spider must be used instead of the traditional spider, otherwise false.
        """

        spiderId = -1

        if self.__config.has_spider_configurations:
            spider_config = self.__config.get_spider_by_name(name)
            ajax = True if "ajax" in spider_config else False
            
            logging.debug('Trying to start Spider (Ajax: %s) by configuration index %s', str(ajax), str(index))
            spiderId = self._start_spider(spider_config=spider_config, ajax=ajax)
        
        return int(spiderId)

    def wait_until_http_spider_finished(self, spider_id: int):
        """ Wait until the running ZAP Spider finished and log results.
        
        Parameters
        ----------
        spider_id: int
            The id of the running spider instance.
        """

        if(spider_id >= 0):
            while (int(self.__zap.spider.status(spider_id)) < 100):
                logging.info("HTTP Spider(%s) progress: %s", str(spider_id), str(self.__zap.spider.status(spider_id)))
                time.sleep(1)
                
            logging.info("HTTP Spider(%s) completed", str(spider_id))

            # Print out a count of the number of urls
            num_urls = len(self.__zap.core.urls())
            if num_urls == 0:
                logging.error("No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container")
                raise RuntimeError('No URLs found by ZAP Spider :-( - is the target URL accessible? Local services may not be accessible from the Docker container')
            else:
                logging.info("Spider(%s) found total: %s URLs", str(spider_id), str(num_urls))
                for url in self.__zap.spider.results(scanid=spider_id):
                    logging.info("URL: %s", url)
    
    def wait_until_ajax_spider_finished(self):
        """ Wait until the running ZAP Spider finished and log results.
        
        Parameters
        ----------
        spider_id: int
            The id of the running spider instance.
        """

        if(self.__zap.ajaxSpider.status == 'running'):
            while (self.__zap.ajaxSpider.status == 'running'):
                logging.info('Ajax Spider running, found urls: %s', self.__zap.ajaxSpider.number_of_results)
                time.sleep(1)
                
            logging.info('Ajax Spider complete')

            # Print out a count of the number of urls
            num_urls = len(self.__zap.core.urls())
            if num_urls == 0:
                logging.error("No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container")
                raise RuntimeError('No URLs found by ZAP Spider :-( - is the target URL accessible? Local services may not be accessible from the Docker container')
            else:
                logging.info("Ajax Spider found total: %s URLs", str(num_urls))
                for url in self.__zap.ajaxSpider.results():
                    logging.info("URL: %s", url['requestHeader'])
    

    def _start_spider(self, spider_config: collections.OrderedDict, ajax: bool) -> int:
        """ Starts a ZAP Spider with the given spiders configuration, based on the internal referenced ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        ajax: bool
            True if the ajax spider must be used instead of the traditional spider, otherwise false.
        """
        spiderId = ""
        user_id = None
        context_id = None
        context_name = None
        ajax = False
        target = ""

        # Clear all excisting/previous spider data
        self.__zap.spider.remove_all_scans()

        if("url" in spider_config):
            target = str(spider_config['url'])
        else:
            logging.warning("The spider has no 'URL' target defined, trying to use the context URL")
            # TODO: hanlde missing url

        # "Context" is an optional config for spider
        if("ajax" in spider_config):
            ajax = bool(spider_config['ajax'])

        # "Context" is an optional config for spider
        if("context" in spider_config):
        
            context_name = str(spider_config['context'])
            spider_context_config = self.__config.get_context_by_name(context_name)
            context_id = int(spider_context_config['id'])

            # "User" is an optional config for spider in addition to the context
            if("user" in spider_config):

                user_name = str(spider_config['user'])
                # search for the current ZAP Context id for the given context name
                user_id = int(self.__config.get_context_user_by_name(spider_context_config, user_name)['id'])
                user_username = self.__config.get_context_user_by_name(spider_context_config, user_name)['username']
        
        # Open first URL before the spider start's to crawl
        self.__zap.core.access_url(target)

        # Start Spider:
        if (ajax):
            logging.info('Trying to start "ajax" Spider with config: %s', spider_config)
            spiderId = self.__start_spider_ajax(spider_config, target, context_name, user_username)

            if ("OK" != str(spiderId)):
                logging.error("Spider couldn't be started due to errors: %s", spiderId)
                raise RuntimeError("Spider couldn't be started due to errors: %s", spiderId)
            else:
                # due to the fact that there can be only one ajax spider at once the id is "pinned" to 1
                spiderId = 1
                logging.info("Spider successfully started with id: %s", spiderId)
                # Give the scanner a chance to start
                time.sleep(5)
            
                self.wait_until_ajax_spider_finished()

        else:
            logging.info('Trying to start "traditional" Spider with config: %s', spider_config)
            spiderId = self.__start_spider_http(spider_config, target, context_id, context_name, user_id)

            if (not str(spiderId).isdigit()) or int(spiderId) < 0:
                logging.error("Spider couldn't be started due to errors: %s", spiderId)
                raise RuntimeError("Spider couldn't be started due to errors: %s", spiderId)
            else:
                logging.info("Spider successfully started with id: %s", spiderId)
                # Give the scanner a chance to start
                time.sleep(5)
            
            self.wait_until_http_spider_finished(int(spiderId))

        return spiderId

    def __start_spider_http(self, spider_config: collections.OrderedDict, target: str, context_id: int, context_name: str, user_id: int) -> str:
        """ Starts a traditional HTTP based ZAP Spider with the given context and user configuration, based on the given spider configuration and ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The context id
        target: str
            The target to spider.
        context_id: int
            The internal ZAP id of the context that must be used during spidering (e.g. for authentication).
        context_name: str
            The  name of the context that must be used during spidering (e.g. for authentication).
        user_id: int
            The user id must be used during spidering (for authentication). (Optional)
        """
        spiderId = ""
        spider = self.__zap.spider

        # Configure Spider Options
        self.__configure_http_spider(spider, spider_config)
        
        # Spider target
        if (not context_id is None) and context_id >= 0 and (not user_id is None) and user_id >= 0:
            logging.info('Starting traditional Spider(%s) with Context(%s) and User(%s)', target, context_id, user_id)
            spiderId = self.__zap.spider.scan_as_user(url=target, contextid=context_id, userid=user_id)
        else:
            logging.info('Starting traditional Spider(url=%s, contextname=%s)', target, context_name)
            spiderId = self.__zap.spider.scan(url=target, contextname=context_name)
        
        return spiderId
    
    def __start_spider_ajax(self, spider_config: collections.OrderedDict, target: str, context_name: str, user_name: str) -> str:
        """ Starts a ajax ZAP Spider with the given name for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The context id
        target: str
            The target to spider.
        context_id: int
            The internal ZAP id of the context that must be used during spidering (e.g. for authentication).
        context_name: str
            The  name of the context that must be used during spidering (e.g. for authentication).
        user_id: int
            The user id must be used during spidering (for authentication). (Optional)
        """

        spiderId = ""
        spider = self.__zap.ajaxSpider

        # Configure Ajax Spider
        self.__configure_ajax_spider(spider, spider_config)

        # Spider target
        
        if (not context_name is None) and len(context_name) >= 0 and (not user_name is None) and len(user_name) >= 0:
            logging.info('Starting Ajax Spider(%s) with Context(%s) and User(%s)', target, context_name, user_name)
            spiderId = self.__zap.ajaxSpider.scan_as_user(url=target, contextname=context_name, username=user_name)
        else:
            logging.debug('Starting Ajax Spider(url=%s, contextname=%s)', target, context)
            spiderId = self.__zap.ajaxSpider.scan(url=target, contextname=context_name)

        return spiderId

    def __configure_http_spider(self, zap_spider: spider, spider_config: collections.OrderedDict):
        """ Configures a ZAP HTTP Spider with the given spider configuration, based on the running ZAP instance.
        
        Parameters
        ----------
        zap_spider: spider
            The reference to the running ZAP spider to configure.
        spider_config: collections.OrderedDict
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

    def __configure_ajax_spider(self, zap_spider: ajaxSpider, spider_config: collections.OrderedDict):
        """ Configures a ZAP Ajax Spider with the given spider configuration, based on the running ZAP instance.
        
        Parameters
        ----------
        zap_spider: spider
            The reference to the running ZAP spider to configure.
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """

        logging.debug('Trying to configure the AjaxSpider')
            
        # Configure Spider (ajax or http)
        
        if "maxDuration" in spider_config and (spider_config['maxDuration'] is not None) and spider_config['maxDuration'] >= 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_max_duration(str(spider_config['maxDuration'])), 
                method="set_option_max_duration"
            )
        if "maxDepth" in spider_config and (spider_config['maxDepth'] is not None) and spider_config['maxDepth'] >= 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_max_crawl_depth(str(spider_config['maxDepth'])), 
                method="set_option_max_crawl_depth"
            )
        if "maxStates" in spider_config and (spider_config['maxStates'] is not None) and spider_config['maxStates'] >= 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_max_crawl_states(str(spider_config['maxStates'])), 
                method="set_option_max_crawl_states"
            )
        if "browserId" in spider_config and (spider_config['browserId'] is not None):
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_browser_id(str(spider_config['browserId'])), 
                method="set_option_browser_id"
            )
        if "browserCount" in spider_config and (spider_config['browserCount'] is not None) and spider_config['browserCount'] >= 0:
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_number_of_browsers(str(spider_config['browserCount'])), 
                method="set_option_number_of_browsers"
            )
        if "randomInputs" in spider_config and (spider_config['randomInputs'] is not None):
            self.__check_zap_spider_result(
                spiderId=zap_spider.set_option_random_inputs(str(spider_config['randomInputs'])), 
                method="set_option_random_inputs"
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
            logging.warning("Failed to configure Spider ['%s'], result is: '%s'", method, spiderId)
        else:
            logging.debug("Successfull configured Spider ['%s'], result is: '%s'", method, spiderId)
