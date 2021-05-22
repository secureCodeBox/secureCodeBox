#!/usr/bin/env python

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import collections
import logging
import glob
import hiyapyco

from .zap_configuration_context import ZapConfigurationContext
from .zap_configuration_context_users import ZapConfigurationContextUsers
from .zap_configuration_api import ZapConfigurationApi
from .zap_configuration_spider import ZapConfigurationSpider
from .zap_configuration_scanner import ZapConfigurationScanner

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapClient')
class ZapConfiguration:
    """This class represent a ZAP specific configuration based on a given YAML file."""
    
    def __init__(self, config_dir: str):
        """Initial constructor used for this class
        
        Parameters
        ----------
        config_dir : str
            The relative path to the config dir containing all relevant config YAML files.
        """
        
        self.config_dir = config_dir
        self.config_dir_glob = config_dir + "*.yaml"
        
        self.__config = collections.OrderedDict()
        self.__read_config_files()
        self.__parse_configurations()

    def __read_config_files(self):
        """Private method to read all existing config YAML files an create a new ZAP Configuration object"""

        if self.config_dir is not None and len(self.config_dir) > 0:
            logging.debug("ZAP YAML config dir: '%s'", self.config_dir)
            config_files = glob.glob(self.config_dir_glob)
        else:
            logging.warning("YAML config dir not found! This is no problem but possibly not intendend here.")
            config_files = []
            
        logging.info("Importing YAML files for ZAP configuration at dir: '%s'", config_files)
        if (len(config_files) > 0):
            config_files.sort()
            self.__config = hiyapyco.load(*config_files, method=hiyapyco.METHOD_MERGE, interpolate=True, mergelists=True, failonmissingfiles=False)
            logging.debug("Finished importing YAML: %s", self.__config)
            
            self.__parse_configurations()
        else:
            logging.warning("No ZAP YAML Configuration files found :-/ This is no problem but possibly not intendend here.")
            self.__config = collections.OrderedDict()
    
    def __parse_configurations(self):
        if self.has_configurations and ("contexts" in self.get_configurations):
            self.__context_configuration = ZapConfigurationContext(context_configurations=self.get_configurations["contexts"])
        else:
            self.__context_configuration = ZapConfigurationContext(context_configurations=collections.OrderedDict())
        
        if self.has_configurations and ("apis" in self.get_configurations):
            self.__api_configuration = ZapConfigurationApi(api_configurations=self.get_configurations["apis"])
        else:
            self.__api_configuration = ZapConfigurationApi(api_configurations=collections.OrderedDict())
        
        if self.has_configurations and ("spiders" in self.get_configurations):
            self.__spider_configuration = ZapConfigurationSpider(spider_configurations=self.get_configurations["spiders"])
        else:
            self.__spider_configuration = ZapConfigurationSpider(spider_configurations=collections.OrderedDict())
        
        if self.has_configurations and ("scanners" in self.get_configurations):
            self.__scanner_configuration = ZapConfigurationScanner(scanner_configurations=self.get_configurations["scanners"])
        else:
            self.__scanner_configuration = ZapConfigurationScanner(scanner_configurations=collections.OrderedDict())

    @property
    def has_configurations(self) -> bool:
        """Returns true if any ZAP Configuration is defined, otherwise false."""
        
        return (self.__config is not None) and len(self.__config) > 0
    
    @property
    def get_configurations(self) -> collections.OrderedDict():
        """Returns the complete ZAP Configuration object"""

        return self.__config

    def has_global_configurations(self) -> bool:
        """Returns true if any ZAP Global Configuration is defined, otherwise false."""
        
        return (self.has_configurations and "global" in self.get_configurations)
    
    @property
    def get_global(self) -> collections.OrderedDict():
        """Returns the complete ZAP Configuration object"""
        result = collections.OrderedDict()

        if self.has_global_configurations():
            result = self.get_configurations["global"]

        return result

    @property
    def get_contexts(self) -> ZapConfigurationContext:
        return self.__context_configuration
    
    @property
    def has_contexts_configurations(self) -> bool:
        return self.has_configurations and self.__context_configuration.has_configurations
    
    @property
    def get_apis(self) -> ZapConfigurationApi:
        return self.__api_configuration

    @property
    def has_apis_configurations(self) -> bool:
        return self.has_configurations and self.__api_configuration.has_configurations

    @property
    def get_spiders(self) -> ZapConfigurationSpider:
        return self.__spider_configuration
    
    @property
    def has_spiders_configurations(self) -> bool:
        return self.has_configurations and self.__spider_configuration.has_configurations
    
    @property
    def get_scanners(self) -> ZapConfigurationScanner:
        return self.__scanner_configuration
    
    @property
    def has_scanners_configurations(self) -> bool:
        return self.has_configurations and self.__scanner_configuration.has_configurations

    def __str__(self):
        return " ZapConfiguration( " + str(self.get_configurations) + " )"
