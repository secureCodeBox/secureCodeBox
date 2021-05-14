#!/usr/bin/env python
# -*- coding: utf-8 -*-

import collections
import logging
import glob
import hiyapyco
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

    def __read_config_files(self):
        """Private method to read all existing config YAML files an create a new ZAP Configuration object"""

        if self.config_dir:
            logging.debug("ZAP YAML config dir: '%s'", self.config_dir)
            config_files = glob.glob(self.config_dir_glob)
        else:
            logging.warning("YAML config dir not found! This is no problem but possibly not intendend here.")
            config_files = []
            
        logging.info("Importing YAML files for ZAP configuration at dir: '%s'", config_files)
        if (len(config_files) > 0):
            config_files.sort()
            self.__config = hiyapyco.load(*config_files, method=hiyapyco.METHOD_MERGE, interpolate=True, mergelists=True, failonmissingfiles=False)
            logging.info("Finished importing YAML: %s", self.__config)
        else:
            logging.warning("No ZAP YAML Configuration files found :-/ This is no problem but possibly not intendend here.")
            self.__config = None


    def has_configurations(self) -> bool:
        """Returns true if any ZAP Configuration is defined, otherwise false."""
        
        return (not self.__config == None) and len(self.__config) > 0
    
    def get_configurations(self) -> collections.OrderedDict():
        """Returns the complete ZAP Configuration object"""

        return self.__config


    def has_global_configurations(self) -> bool:
        """Returns true if any ZAP Global Configuration is defined, otherwise false."""
        
        return (self.has_configurations() and "global" in self.get_configurations())
    
    def get_global(self) -> collections.OrderedDict():
        """Returns the complete ZAP Configuration object"""
        result = collections.OrderedDict()

        if self.has_global_configurations():
            result = self.get_configurations()["global"]

        return result

    
    def has_contexts_configurations(self) -> bool:
        """Returns true if any ZAP Context is defined, otherwise false."""

        return (self.has_configurations() and "contexts" in self.get_configurations())
    
    def get_contexts(self) -> list:
        """Returns a list with all ZAP Context configuration objects"""
        result = collections.OrderedDict()

        if self.has_contexts_configurations():
            result = self.get_configurations()["contexts"]

        return result
    
    def get_context_by_index(self, index: int) -> collections.OrderedDict:
        """Returns the ZAP Context configuration object with the given index.
        
        Parameters
        ----------
        index: int
            The list index of the context to return from the list of contexts.
        """
        result = collections.OrderedDict()

        if self.has_contexts_configurations and len(self.get_contexts()) > index:
            result = self.get_contexts()[index]

        return result
    
    def get_context_by_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP Context configuration object with the given name.
        
        Parameters
        ----------
        name: str
            The name of the context to return from the list of contexts.
        """

        result = collections.OrderedDict()

        if self.has_contexts_configurations:
            result = next((context for context in self.get_contexts() if context['name'] == name), None)

        return result

    def get_context_by_url(self, url: str) -> collections.OrderedDict:
        """Returns the ZAP Context configuration object based on the given target url.
        
        Parameters
        ----------
        url: str
            The url of the context to return from the list of contexts.
        """

        result = collections.OrderedDict()

        if self.has_contexts_configurations:
            result = next((context for context in self.get_contexts() if context['url'] == url), None)
        else:
            logging.warning("There is no context configuration to search for.")

        return result

    def has_context_users_configurations(self, context: collections.OrderedDict) -> bool:
        """Returns true if any ZAP Context Users are defined, otherwise false."""

        return (self.has_contexts_configurations() and ("users" in context) and len(context["users"]) > 0)
    
    def get_context_users(self, context: collections.OrderedDict) -> list:
        """Returns a list with all ZAP Context Users configuration objects
        
        Parameters
        ----------
        context: collections.OrderedDict
            The ZAP context configuration object to return the users list for.
        """
        result = collections.OrderedDict()

        logging.info("get_context_users has_context_users_configurations(context=%s)", context)

        if self.has_context_users_configurations(context):
            result = context["users"]

        return result
    
    def get_context_user_by_index(self, context: collections.OrderedDict, index: int) -> collections.OrderedDict:
        """Returns the ZAP Context User configuration object with the given index.
        
        Parameters
        ----------
        context: collections.OrderedDict
            The ZAP context configuration object to return the user for.
        index: int
            The list index of the context to return from the list of contexts.
        """
        result = collections.OrderedDict()
        authentications = self.get_context_users(context)

        if self.has_context_users_configurations(context) and len(authentications) > index:
            result = authentications[index]

        return result
    
    def get_context_user_by_name(self, context: collections.OrderedDict, name: str) -> collections.OrderedDict:
        """Returns the ZAP Context Users configuration object with the given name.
        
        Parameters
        ----------
        context: collections.OrderedDict
            The ZAP context configuration object to return the user for.
        name: str
            The name of the context to return from the list of contexts.
        """

        result = collections.OrderedDict()
        users = self.get_context_users(context)

        logging.info("get_context_user_by_name(name=%s, users=%s", name, users)

        if self.has_context_users_configurations(context):
            result = next((user for user in users if user['name'] == name), None)

        return result


    def has_scans_configurations(self) -> bool:
        """Returns true if any ZAP Scan is defined, otherwise false."""

        return (self.has_configurations() and "scanners" in self.get_configurations())

    def get_scans(self) -> list:
        """Returns a list with all ZAP Scan configuration objects"""
        result = collections.OrderedDict()

        if self.has_scans_configurations:
            result = self.__config["scanners"]
        else:
            logging.debug("No scanner specific configuration found!")

        return result
    
    def get_scan_by_index(self, index: int) -> collections.OrderedDict:
        """Returns the ZAP Scan configuration object with the given index.
        
        Parameters
        ----------
        index: int
            The list index of the scan to return from the list of scans.
        """
        result = collections.OrderedDict()

        if self.has_scans_configurations and len(self.get_scans()) > index:
            result = self.get_scans()[index]
        else:
            logging.warning("No scanner specific configuration found! Therefore couldn't find the scanner configuration with the index: %s", index)

        return result
    
    def get_scan_by_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP Scan configuration object with the given name.
        
        Parameters
        ----------
        name: str
            The name of the scan to return from the list of scans.
        """
        result = collections.OrderedDict()

        if self.has_scans_configurations:
            result = next((scan for scan in self.get_scans() if scan['name'] == name), None)
        else:
            logging.warning("No scanner specific configuration found! Therefore couldn't find the scanner configuration with the name: %s", name)

        return result
    
    def get_scan_by_context_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP Scan configuration object with the referencing context name.
        
        Parameters
        ----------
        name: str
            The name of the context which is referenced in the scanner configuration to return from the list of scans.
        """
        result = collections.OrderedDict()

        if self.has_scans_configurations:
            result = next((scan for scan in self.get_scans() if scan['context'] == name), None)
        else:
            logging.warning("No scanner specific configuration found! Therefore couldn't find the scanner configuration with the context name: %s", name)

        return result


    def has_spiders_configurations(self) -> bool:
        """Returns true if any ZAP Spider is defined, otherwise false."""

        return (self.has_configurations() and "spiders" in self.get_configurations())

    def get_spiders(self) -> list:
        """Returns a list with all ZAP Spider configuration objects"""
        result = collections.OrderedDict()

        if self.has_spiders_configurations:
            result = self.__config["spiders"]

        return result
    
    def get_spider_by_index(self, index: int) -> collections.OrderedDict:
        """Returns the ZAP Spider configuration object with the given index.
        
        Parameters
        ----------
        index: int
            The list index of the spider to return from the list of spiders.
        """
        result = collections.OrderedDict()

        if self.has_spiders_configurations and len(self.get_spiders()) > index:
            result = self.get_spiders()[index]

        return result
    
    def get_spider_by_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP Spider configuration object with the given name.
        
        Parameters
        ----------
        name: str
            The name of the spider to return from the list of spiders.
        """
        result = collections.OrderedDict()

        if self.has_spiders_configurations:
            result = next((spider for spider in self.get_spiders() if spider['name'] == name), None)

        return result
    
    def get_spider_by_context_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP Spider configuration object with the given context name referenced.
        
        Parameters
        ----------
        name: str
            The name of the context referenced in the spider config to return to return from the list of spiders.
        """
        result = collections.OrderedDict()

        if self.has_spiders_configurations:
            result = next((spider for spider in self.get_spiders() if spider['context'] == name), None)

        return result


    def has_api_configurations(self) -> bool:
        """Returns true if any ZAP OpenAPI configuration is defined, otherwise false."""

        return (self.has_configurations() and "apis" in self.get_configurations())

    def get_api_configurations(self) -> list:
        """Returns a list with all ZAP OpenAPI configuration objects"""
        result = collections.OrderedDict()

        if self.has_api_configurations:
            result = self.__config["apis"]

        return result
    
    def get_api_configurations_by_index(self, index: int) -> collections.OrderedDict:
        """Returns the ZAP OpenApi configuration object with the given index.
        
        Parameters
        ----------
        index: int
            The list index of the OpenApi config to return from the list of apis.
        """
        result = collections.OrderedDict()

        if self.has_api_configurations and len(self.get_api_configurations()) > index:
            result = self.get_api_configurations()[index]

        return result
    
    def get_api_configurations_by_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP OpenApi configuration object with the given name.
        
        Parameters
        ----------
        name: str
            The name of the OpenApi to return from the list of apis.
        """
        result = collections.OrderedDict()

        if self.has_api_configurations:
            result = next((api for api in self.get_api_configurations() if api['name'] == name), None)

        return result
    
    def get_api_configurations_by_context_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP OpenApi configuration object with the given context name referenced.
        
        Parameters
        ----------
        name: str
            The name of the context referenced in the OpenApi config to return to return from the list of apis.
        """
        result = collections.OrderedDict()

        if self.has_api_configurations:
            result = next((api for api in self.get_api_configurations() if api['context'] == name), None)

        return result

    def __str__(self):
        return " ZapConfiguration( " + str(self.get_configurations()) + " )"
