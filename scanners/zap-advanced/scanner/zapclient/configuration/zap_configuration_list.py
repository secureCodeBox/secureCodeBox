#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging
import collections

from zapv2 import ZAPv2

from abc import ABC, abstractmethod

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigurationList')

class ZapConfigurationList(ABC):
    """This class configures a scanner in a running ZAP instance, based on a ZAP Configuration"""

    def __init__(self, configuration_list: list, type_name: str, yaml_name: str):
        """Initial constructor used for this class
        
        Parameters
        ----------
        configuration_list: list
            The configuration object containing all ZAP configs (based on the class ZapConfiguration).
        type_name: str
            The name the the configuration corresponding to a ZAP API (type).
        """
        
        self.__configuration_list = configuration_list
        self.__type_name = type_name
        self.__yaml_name = yaml_name

    @property
    def get_type_name(self) -> str:
        """The name of the configuration corresponding to a ZAP API (type)."""

        return self.__type_name
    
    @property
    def get_yaml_name(self) -> str:
        """The yaml name of the configuration corresponding to a ZAP API (type)."""

        return self.__yaml_name
    
    @property
    def has_configurations(self) -> bool:
        """"Returns true if any configuration is defined, otherwise false."""

        return (self.__configuration_list is not None) and len(self.__configuration_list) > 0

    @property
    def get_configurations(self) -> list:
        """Returns a list with configuration objects."""

        return self.__configuration_list
    
    def get_configuration_by_index(self, index: int) -> collections.OrderedDict:
        """Returns the ZAP configuration object with the given index.
        
        Parameters
        ----------
        index: int
            The list index of the sconfiguration object to return from the list of configurations.
        """
        result = collections.OrderedDict()

        if self.has_configurations and len(self.get_configurations) > index:
            result = self.get_configurations[index]
        else:
            logging.warning("No '%s' specific configuration found (%s.[%s]: )! There is no '%s' configuration with the index: %s", 
                self.get_type_name,
                self.get_yaml_name,
                index,
                self.get_type_name,
                index
            )

        return result
    
    def get_configuration_by_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP configuration object with the given name.
        
        Parameters
        ----------
        name: str
            The name of the configuration object to return from the list of configurations.
        """
        result = collections.OrderedDict()

        if self.has_configurations:
            result = next((configuration for configuration in self.get_configurations if name in configuration and configuration['name'] == name), None)
        else:
            logging.warning("No '%s' specific configuration found (%s.[].name: '%s')! Couldn't find any '%s' configuration with the name: %s", 
                self.get_type_name, 
                self.get_yaml_name,
                name,
                self.get_type_name, 
                name
            )

        return result
    
    def get_configuration_by_context_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP configuration object with the referencing context name.
        
        Parameters
        ----------
        name: str
            The name of the configation object which is referenced in the configuration object to return from the list of configurations.
        """
        result = collections.OrderedDict()

        if self.has_configurations:
            logging.debug("Searching for a '%s' config, referencing the context name (%s.[].context: '%s') in the list of #%s configurations. %s", 
                self.get_type_name, 
                self.get_yaml_name, 
                name,
                len(self.get_configurations),
                self.get_configurations
            )
            result = next((configuration for configuration in self.get_configurations if 'context' in configuration and configuration['context'] == name), None)
        else:
            logging.warning("No '%s' specific configuration found referencing the given context name (%s.[].context: '%s')! Couldn't find any '%s' configuration with the context name: %s", 
                self.get_type_name, 
                self.get_yaml_name,
                name,
                self.get_type_name, 
                name
            )

        return result

    def get_configuration_by_url(self, url: str) -> collections.OrderedDict:
        """Returns the ZAP Context configuration object based on the given url.
        
        Parameters
        ----------
        url: str
            The url of the context to return from the list of contexts.
        """

        result = collections.OrderedDict()

        if self.has_configurations:
            result = next((configuration for configuration in self.get_configurations if 'url' in configuration and configuration['url'] == url), None)
        else:
            logging.warning("No '%s' specific configuration found using the given url (%s.[].url: '%s')! Couldn't find any '%s' configuration with the url: %s", 
                self.get_type_name, 
                self.get_yaml_name,
                url,
                self.get_type_name, 
                url
            )

        return result