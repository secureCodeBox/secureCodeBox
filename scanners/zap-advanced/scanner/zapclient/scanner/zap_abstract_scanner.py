#!/usr/bin/env python
# -*- coding: utf-8 -*-

import collections
import logging

from zapv2 import ZAPv2
from abc import abstractmethod

from .. import ZapClient
from ..configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureScanner')

class ZapConfigureScanner(ZapClient):
    """This class configures a scanner in a running ZAP instance, based on a ZAP Configuration
    
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

    def start_scan_by_url(self, url: str) -> int:
        """ Starts a ZAP ActiveScan for the given target, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        url: str
            The url to scan with the ZAP active scanner.
        """
        scannerId = -1

        if self.get_config.get_scanners.has_configurations:
            logging.debug("Trying to start ActiveScan by configuration target url: '%s'", str(url))
            # Search for the corresponding context object related to the given url
            context_config=self.get_config.get_contexts.get_configuration_by_url(url)
            # Search for a API configuration referencing the context identified by url
            
            scanner_config=None
            if not context_config == None and "name" in context_config:
                scanner_config=self.get_config.get_scanners.get_configuration_by_context_name(str(context_config["name"]))
            else:
                logging.warning("No context configuration found for target: %s! Starting active scanning without any related context.", url)

            scannerId = self.start_scanner(url=url, scanner_config=scanner_config)
        else:
            logging.warning("There is no scanner configuration section defined in your configuration YAML to start by url: %s.", url)
            scannerId = self.start_scanner(url=url, scanner_config=None)

        return int(scannerId)

    def start_scan_by_index(self, index: int) -> int:
        """ Starts a ZAP ActiveScan with the given index for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The index of the scanner object in the list of scanners configuration.
        """
        scannerId = -1

        if self.get_config.get_scanners.has_configurations:
            logging.debug('Trying to start ActiveScan by configuration index %s', str(index))
            scannerId = self.start_scanner(url=None, scanner_config=self.get_config.get_scanners.get_configuration_by_index(index))
        else:
            logging.warning("There is no scanner configuration section defined in your configuration YAML to start by index: %s.", index)
            scannerId = self.start_scanner(url=None, scanner_config=None)

        return int(scannerId)

    def start_scan_by_name(self, name: str) -> int:
        """ Starts a ZAP ActiveScan with the given name for the scanners configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The name of the scanner object in the list of scanners configuration.
        """
        scannerId = -1

        if self.get_config.get_scanners.has_configurations:
            logging.debug('Trying to start ActiveScan by configuration name %s', str(name))
            scannerId = self.start_scanner(url=None, scanner_config=self.get_config.get_scanners.get_configuration_by_name(name))
        else:
            logging.warning("There is no scanner configuration section defined in your configuration YAML to start by name: %s.", name)
            scannerId = self.start_scanner(url=None, scanner_config=None)

        return int(scannerId)
    
    @abstractmethod
    def start_scanner(self, url: str, scanner_config: collections.OrderedDict) -> int:
        """ Starts a ZAP Spider with the given spiders configuration, based on the internal referenced ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        raise NotImplementedError

    @abstractmethod
    def wait_until_finished(self, scanner_id: int):
        """ Wait until the running ZAP Scanner finished and log results."""
        raise NotImplementedError
