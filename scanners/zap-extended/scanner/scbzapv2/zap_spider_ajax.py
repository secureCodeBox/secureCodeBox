import os
import sys
import time
import json
import requests
import base64
import collections
import logging

from urllib.parse import urlparse
from zapv2 import ZAPv2, ajaxSpider

from .zap_configuration import ZapConfiguration
from .zap_abstract_spider import ZapConfigureSpider

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureSpiderAjax')

class ZapConfigureSpiderAjax(ZapConfigureSpider):
    """This class configures a ZAP Ajax Spider in a running ZAP instance, based on a ZAP Configuration
    
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

    def wait_until_spider_finished(self):
        """ Wait until the running ZAP Spider finished and log results.
        
        Parameters
        ----------
        spider_id: int
            The id of the running spider instance.
        """

        if(self.get_zap_spider.status == 'running'):
            while (self.get_zap_spider.status == 'running'):
                logging.info('Ajax Spider running, found urls: %s', self.get_zap_spider.number_of_results)
                time.sleep(1)
                
            logging.info('Ajax Spider complete')

        # Print out a count of the number of urls
        num_urls = len(self.get_zap.core.urls())
        if num_urls == 0:
            logging.error("No URLs found - is the target URL accessible? Local services may not be accessible from the Docker container")
            raise RuntimeError('No URLs found by ZAP Spider :-( - is the target URL accessible? Local services may not be accessible from the Docker container')
        else:
            logging.info("Ajax Spider found total: %s URLs", str(num_urls))
            for url in self.get_zap_spider.results():
                logging.info("URL: %s", url['requestHeader'])
    

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
                spider_context_config = self.__config.get_context_by_name(context_name)
                context_id = int(spider_context_config['id'])

                # "User" is an optional config for spider in addition to the context
                if("user" in spider_config):

                    user_name = str(spider_config['user'])
                    # search for the current ZAP Context id for the given context name
                    user_id = int(self.__config.get_context_user_by_name(spider_context_config, user_name)['id'])
                    user_username = self.__config.get_context_user_by_name(spider_context_config, user_name)['username']
            
            # Open first URL before the spider start's to crawl
            self.get_zap.core.access_url(target)

            # Always start with traditional spider first (even if ajax=true) to ensure the maximum spider results
            logging.info('Trying to start "traditional" Spider with config: %s', spider_config)
            spiderId = self.__start_spider_http(spider_config, target, context_id, context_name, user_id)

            
            logging.info('Trying to start "ajax" Spider with config: %s', spider_config)
            spiderId = self.__start_spider(spider_config, target, context_name, user_username)

            if ("OK" != str(spiderId)):
                logging.error("Spider couldn't be started due to errors: %s", spiderId)
                raise RuntimeError("Spider couldn't be started due to errors: %s", spiderId)
            else:
                # due to the fact that there can be only one ajax spider at once the id is "pinned" to 1
                spiderId = 1
                logging.info("Spider successfully started with id: %s", spiderId)
                # Give the scanner a chance to start
                time.sleep(5)
            
                self.wait_until_spider_finished()

        else:
            logging.info("Trying to start 'traditional' Spider to spider target '%s' without any additinal config!", url)
            spiderId = self.__start_spider(spider_config=None, target=url, context_id=None, context_name=None, user_id=None)
        
        return spiderId

    def __start_spider(self, spider_config: collections.OrderedDict, target: str, context_name: str, user_name: str) -> str:
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
        spider = self.get_zap_spider

        # Configure Ajax Spider
        self.__configure_ajax_spider(spider, spider_config)

        # Spider target
        
        if (not context_name is None) and len(context_name) >= 0 and (not user_name is None) and len(user_name) >= 0:
            logging.info('Starting Ajax Spider(%s) with Context(%s) and User(%s)', target, context_name, user_name)
            spiderId = self.get_zap_spider.scan_as_user(url=target, contextname=context_name, username=user_name)
        else:
            logging.debug('Starting Ajax Spider(url=%s, contextname=%s)', target, context_name)
            spiderId = self.get_zap_spider.scan(url=target, contextname=context_name)

        return spiderId

    def __configure_spider(self, zap_spider: ajaxSpider, spider_config: collections.OrderedDict):
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
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_max_duration(str(spider_config['maxDuration'])), 
                method="set_option_max_duration"
            )
        if "maxDepth" in spider_config and (spider_config['maxDepth'] is not None) and spider_config['maxDepth'] >= 0:
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_max_crawl_depth(str(spider_config['maxDepth'])), 
                method="set_option_max_crawl_depth"
            )
        if "maxStates" in spider_config and (spider_config['maxStates'] is not None) and spider_config['maxStates'] >= 0:
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_max_crawl_states(str(spider_config['maxStates'])), 
                method="set_option_max_crawl_states"
            )
        if "browserId" in spider_config and (spider_config['browserId'] is not None):
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_browser_id(str(spider_config['browserId'])), 
                method="set_option_browser_id"
            )
        if "browserCount" in spider_config and (spider_config['browserCount'] is not None) and spider_config['browserCount'] >= 0:
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_number_of_browsers(str(spider_config['browserCount'])), 
                method="set_option_number_of_browsers"
            )
        if "randomInputs" in spider_config and (spider_config['randomInputs'] is not None):
            self._check_zap_spider_result(
                spiderId=zap_spider.set_option_random_inputs(str(spider_config['randomInputs'])), 
                method="set_option_random_inputs"
            )