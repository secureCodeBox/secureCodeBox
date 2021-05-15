#!/usr/bin/env python
# -*- coding: utf-8 -*-

import collections
import logging

from abc import abstractmethod
from zapv2 import ZAPv2, spider

from .. import ZapClient
from ..configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureSpider')

class ZapConfigureSpider(ZapClient):
    """This abstract class configures a ZAP Spider in a running ZAP instance, based on a ZAP Configuration.
    
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
        
        self.__spider_config = None
        self.__ajax = False

    
    @property
    def get_spider_config(self) -> collections.OrderedDict:
        """ Returns the spider config of the currently running ZAP instance. """
        return self.__spider_config
    
    def is_ajax_spider_enabled(self) -> bool:
        # "Context" is an optional config for spider
        if(self.get_spider_config is not None and "ajax" in self.get_spider_config and self.get_spider_config["ajax"]):
            self.__ajax = bool(self.get_spider_config['ajax'])
        else:
            logging.debug("No Ajax configuration 'ajax: true' found in spider configuration: %s", self.get_spider_config)
        
        return self.__ajax

    def start_spider_by_url(self, url: str):
        """ Starts a ZAP Spider for the given url, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        url: str
            The url to spider.
        """

        if self.get_config.has_spiders_configurations:
            # Search for the corresponding context object related to the given url
            spider_context=self.get_config.get_contexts.get_configuration_by_url(url)
            
            # Search for a API configuration referencing the context identified by url
            if spider_context is not None and "name" in spider_context:
                self.__spider_config = self.get_config.get_spiders.get_configuration_by_context_name(str(spider_context["name"]))
            else:
                logging.warning("No context configuration found for target: '%s'! Starting spider without any related context.", url)

            logging.info("Trying to start Spider (Ajax: %s) with target url: '%s'", str(self.is_ajax_spider_enabled()), url)
        else:
            logging.warning("There is no spider specific configuration section defined in your configuration YAML to start by url: %s.", url)
        
        self.start_spider(url=url, spider_config=self.get_spider_config)

    def start_spider_by_index(self, index: int):
        """ Starts a ZAP Spider with the given index for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The index of the spider object in the list of spider configuration.
        """

        if self.get_config.get_spiders.has_configurations:
            self.__spider_config = self.get_config.get_spider_by_index(index)
            url = self.get_spider_config["url"] if "url" in self.get_spider_config else None

            logging.debug('Trying to start Spider (Ajax: %s) by configuration index: %s', str(self.is_ajax_spider_enabled()), str(index))
            self.start_spider(url=url, spider_config=self.get_spider_config)
        else:
            logging.warning("No spider specific configuration section defined in your configuration YAML to start by index %s", index)

    def start_spider_by_name(self, name: str) -> int:
        """ Starts a ZAP Spider with the given name for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The name of the spider object in the list of spider configuration.
        """

        if self.__config.get_spiders.has_configurations:
            self.__spider_config = self.get_config.get_spiders.get_configuration_by_name(name)
            url = self.get_spider_config["url"] if "url" in self.get_spider_config else None
            
            logging.debug('Trying to start Spider (Ajax: %s) by name: %s', str(self.is_ajax_spider_enabled()), name)
            self.start_spider(url=url, spider_config=self.get_spider_config)
        else:
            logging.warning("No spider specific configuration section defined in your configuration YAML to start by name %s", name)
    
    @abstractmethod
    def configure_spider(self, zap_spider: spider, spider_config: collections.OrderedDict):
        """ Configures a ZAP HTTP Spider with the given spider configuration, based on the running ZAP instance.
        
        Parameters
        ----------
        zap_spider: spider
            The reference to the running ZAP spider to configure.
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        raise NotImplementedError

    @abstractmethod
    def start_spider(self, url: str, spider_config: collections.OrderedDict):
        """ Starts a ZAP Spider with the given spiders configuration, based on the internal referenced ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        raise NotImplementedError
    
    @abstractmethod
    def wait_until_spider_finished(self):
        """ Wait until the running ZAP Spider finished and log results."""
        raise NotImplementedError
