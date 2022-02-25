#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import collections
import logging
import time

from abc import abstractmethod
from zapv2 import ZAPv2, spider

from .. import ZapClient
from ..configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
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
        if self.get_spider_config is not None and "ajax" in self.get_spider_config and self.get_spider_config["ajax"]:
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

        spider_context = self.get_config.get_active_context_config
        self.__spider_config = self.get_config.get_active_spider_config

        if self.__spider_config is not None:
            # Search for a API configuration referencing the context identified by url
            if spider_context is None:
                logging.warning("No context configuration found for target: '%s'! Starting spider without any related context.", url)
            else:
                logging.info("Trying to start Spider (Ajax: %s) with target url: '%s'", str(self.is_ajax_spider_enabled()), url)
        else:
            logging.warning("There is no spider specific configuration section defined in your configuration YAML to start by url: %s.", url)
        
        self.start_spider(url=url, spider_config=self.get_spider_config)

    @abstractmethod
    def configure_spider(self, spider_config: collections.OrderedDict):
        """ Configures a ZAP HTTP Spider with the given spider configuration, based on the running ZAP instance.
        
        Parameters
        ----------
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
    def check_if_spider_completed(self):
        """Method to ask ZAP Api if the Spider has completed.

        Returns
        -------
        true: if spider has completed
        false: if spider is still working
        """
        raise NotImplementedError

    @abstractmethod
    def print_spider_summary(self):
        """Method to print out a summary of the spider results"""
        raise NotImplementedError

    @abstractmethod
    def stop_spider(self):
        """Method to stop the spider"""
        raise NotImplementedError

    def wait_until_spider_finished(self):
        """
        Waits for the ZAP Spider to complete.

        This method also enforces the "maxDuration" limit of the spider, ZAP normally enforces it on its own,
        but there are cases where the spider has stalled and ZAP was unable to enforce it on its own.
        """
        if "maxDuration" in self.get_config.get_active_spider_config:
            # convert to seconds
            max_duration = self.get_config.get_active_spider_config["maxDuration"] * 60
        else:
            max_duration = None

        wait_time = 0
        # time to wait above the configured max duration, to give ZAP time to enforce the maxDuration itself if possible
        tolerance_duration = 60

        while self.check_if_spider_completed() is not True:
            time.sleep(1)
            wait_time += 1
            if max_duration is not None and wait_time > (max_duration + tolerance_duration):
                logging.info("Spider has run over its configured maxDuration. Stopping Spider.")
                self.stop_spider()
                break

        self.print_spider_summary()
