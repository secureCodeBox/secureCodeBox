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
from .zap_abstract_spider import ZapConfigureSpider

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
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
        super().__init__(zap, config)
    
    @property
    def get_zap_spider(self) -> spider:
        """ Returns the spider of the currently running ZAP instance."""
        return self.get_zap.spider

    def wait_until_spider_finished(self):
        """ Wait until the running ZAP HTTP Spider finished and log results."""

        if(self.has_spider_id):
            while (int(self.get_zap_spider.status(self.get_spider_id)) < 100):
                logging.info("HTTP Spider(%s) progress: %s", str(self.get_spider_id), str(self.get_zap_spider.status(self.get_spider_id)))
                time.sleep(1)
                
            logging.info("HTTP Spider(%s) completed", str(self.get_spider_id))

            # Print out a count of the number of urls
            num_urls = len(self.get_zap.core.urls())
            if num_urls == 0:
                logging.error("No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container")
                raise RuntimeError('No URLs found by ZAP Spider :-( - is the target URL accessible? Local services may not be accessible from the Docker container')
            else:
                logging.info("Spider(%s) found total: %s URLs", str(self.get_spider_id), str(num_urls))
                for url in self.get_zap_spider.results(scanid=self.get_spider_id):
                    logging.info("URL: %s", url)
    
    def _start_spider(self, url: str, spider_config: collections.OrderedDict) -> int:
        """ Starts a ZAP Spider with the given spiders configuration, based on the internal referenced ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        spiderId = -1
        user_id = None
        user_username = None
        context_id = None
        context_name = None
        target = ""

        # Clear all existing/previous spider data
        self.get_zap.spider.remove_all_scans()

        if not spider_config == None:

            if("url" in spider_config):
                target = str(spider_config['url'])
            else:
                logging.warning("The spider configuration section has no specific 'url' target defined, trying to use scanType target instead with url: '%s'", url)
                target=url

            # "Context" is an optional config for spider
            if("context" in spider_config):
            
                context_name = str(spider_config['context'])
                spider_context_config = self.get_config.get_context_by_name(context_name)
                context_id = int(spider_context_config['id'])

                # "User" is an optional config for spider in addition to the context
                if("user" in spider_config):

                    user_name = str(spider_config['user'])
                    # search for the current ZAP Context id for the given context name
                    user_id = int(self.get_config.get_context_user_by_name(spider_context_config, user_name)['id'])
                    user_username = self.get_config.get_context_user_by_name(spider_context_config, user_name)['username']
            
            # Open first URL before the spider start's to crawl
            self.get_zap.core.access_url(target)

            logging.info('Trying to start "traditional" Spider with config: %s', spider_config)
            spiderId = self.__start_spider(spider_config, target, context_id, context_name, user_id)

            if (not str(spiderId).isdigit()) or int(spiderId) < 0:
                logging.error("Spider couldn't be started due to errors: %s", spiderId)
                raise RuntimeError("Spider couldn't be started due to errors: %s", spiderId)
            else:
                logging.info("Spider successfully started with id: %s", spiderId)
                self.__spider_id = spiderId
                # Give the scanner a chance to start
                time.sleep(5)

                self.wait_until_spider_finished(int(spiderId))

        else:
            logging.info("Trying to start 'traditional' Spider to spider target '%s' without any additinal config!", url)
            spiderId = self.__start_spider(spider_config=None, target=url, context_id=None, context_name=None, user_id=None)
        
        return spiderId

    def __start_spider(self, spider_config: collections.OrderedDict, target: str, context_id: int, context_name: str, user_id: int) -> str:
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
        spider = self.get_zap_spider

        # Configure Spider Options if there are any
        if not spider_config == None:
            self.configure_spider(spider, spider_config)
        
        # Spider target
        if (not context_id is None) and context_id >= 0 and (not user_id is None) and user_id >= 0:
            logging.info('Starting traditional Spider(%s) with Context(%s) and User(%s)', target, context_id, user_id)
            spiderId = self.get_zap_spider.scan_as_user(url=target, contextid=context_id, userid=user_id)
        else:
            logging.info('Starting traditional Spider(url=%s, contextname=%s)', target, context_name)
            spiderId = self.get_zap_spider.scan(url=target, contextname=context_name)
        
        return spiderId
    
    def configure_spider(self, zap_spider: spider, spider_config: collections.OrderedDict):
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
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_max_duration(str(spider_config['maxDuration'])), 
                method="set_option_max_duration"
            )
        if "maxDepth" in spider_config and (spider_config['maxDepth'] is not None) and spider_config['maxDepth'] >= 0:
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_max_depth(str(spider_config['maxDepth'])), 
                method="set_option_max_depth"
            )
        if "maxChildren" in spider_config and (spider_config['maxChildren'] is not None) and spider_config['maxChildren'] >= 0:
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_max_children(str(spider_config['maxChildren'])), 
                method="set_option_max_children"
            )
        if "maxParseSizeBytes" in spider_config and (spider_config['maxParseSizeBytes'] is not None) and spider_config['maxParseSizeBytes'] >= 0:
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_max_parse_size_bytes(str(spider_config['maxParseSizeBytes'])), 
                method="set_option_max_parse_size_bytes"
            )
        if "acceptCookies" in spider_config and (spider_config['acceptCookies'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_accept_cookies(str(spider_config['acceptCookies'])), 
                method="set_option_accept_cookies"
            )
        if "handleODataParametersVisited" in spider_config and (spider_config['handleODataParametersVisited'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_handle_o_data_parameters_visited(str(spider_config['handleODataParametersVisited'])), 
                method="set_option_handle_o_data_parameters_visited"
            )
        if "handleParameters" in spider_config and (spider_config['handleParameters'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_handle_parameters(str(spider_config['handleParameters'])), 
                method="set_option_handle_parameters"
            )
        
        if "parseComments" in spider_config and (spider_config['parseComments'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_comments(str(spider_config['parseComments'])), 
                method="set_option_parse_comments"
            )
        if "parseGit" in spider_config and (spider_config['parseGit'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_git(str(spider_config['parseGit'])), 
                method="set_option_parse_git"
            )
        if "parseRobotsTxt" in spider_config and (spider_config['parseRobotsTxt'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_robots_txt(str(spider_config['parseRobotsTxt'])), 
                method="set_option_parse_robots_txt"
            )
        if "parseSitemapXml" in spider_config and (spider_config['parseSitemapXml'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_sitemap_xml(str(spider_config['parseSitemapXml'])), 
                method="set_option_parse_sitemap_xml"
            )
        if "parseSVNEntries" in spider_config and (spider_config['parseSVNEntries'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_parse_svn_entries(str(spider_config['parseSVNEntries'])), 
                method="set_option_parse_svn_entries"
            )
        if "postForm" in spider_config and (spider_config['postForm'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_post_form(str(spider_config['postForm'])), 
                method="set_option_post_form"
            )
        if "processForm" in spider_config and (spider_config['processForm'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_process_form(str(spider_config['processForm'])), 
                method="set_option_process_form"
            )
        
        if "requestWaitTime" in spider_config and (spider_config['requestWaitTime'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_request_wait_time(str(spider_config['requestWaitTime'])), 
                method="set_option_request_wait_time"
            )
        if "sendRefererHeader" in spider_config and (spider_config['sendRefererHeader'] is not None) :
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_send_referer_header(str(spider_config['sendRefererHeader'])), 
                method="set_option_send_referer_header"
            )
        if "threadCount" in spider_config and (spider_config['threadCount'] is not None) and spider_config['threadCount'] >= 0:
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_thread_count(str(spider_config['threadCount'])), 
                method="set_option_thread_count"
            )
        if "userAgent" in spider_config and (spider_config['userAgent'] is not None) and len(spider_config['userAgent']) > 0:
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_user_agent(string=str(spider_config['userAgent'])), 
                method="set_option_user_agent"
            )
