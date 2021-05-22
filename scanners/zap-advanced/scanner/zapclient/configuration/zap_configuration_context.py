#!/usr/bin/env python

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import collections
import logging

from .zap_configuration_list import ZapConfigurationList

class ZapConfigurationContext(ZapConfigurationList):
    """This class represent a ZAP specific for ZAP Context configurations based on a given YAML file."""
    
    def __init__(self, context_configurations: collections.OrderedDict):
        """Initial constructor used for this class
        
        Parameters
        ----------
        context_configurations : str
            The relative path to the config dir containing all relevant config YAML files.
        """
        super().__init__(context_configurations, "context", "contexts")

    def get_configuration_by_context_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP configuration object with the referencing context name.
        
        Parameters
        ----------
        name: str
            The name of the configation object which is referenced in the configuration object to return from the list of configurations.
        """
        result = collections.OrderedDict()

        if self.has_configurations:
            logging.debug("Searching for a '%s' config, referencing the context name (%s.[].name: '%s') in the list of #%s configurations. %s", 
                self.get_type_name, 
                self.get_yaml_name, 
                name,
                len(self.get_configurations),
                self.get_configurations
            )
            result = next((configuration for configuration in self.get_configurations if 'name' in configuration and configuration['name'] == name), None)
        else:
            logging.warning("No '%s' specific configuration found referencing the given context name (%s.[].name: '%s')! Couldn't find any '%s' configuration with the context name: %s", 
                self.get_type_name, 
                self.get_yaml_name,
                name,
                self.get_type_name, 
                name
            )

        return result

    def has_context_users_configurations(self, context: collections.OrderedDict) -> bool:
        """Returns true if any ZAP Context Users are defined, otherwise false."""

        return (self.has_configurations and ("users" in context) and len(context["users"]) > 0)

    def get_context_users(self, context: collections.OrderedDict) -> list:
        """Returns a list with all ZAP Context Users configuration objects
        
        Parameters
        ----------
        context: collections.OrderedDict
            The ZAP context configuration object to return the users list for.
        """
        result = collections.OrderedDict()

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

        if self.has_context_users_configurations(context):
            result = next((user for user in users if user['name'] == name), None)

        return result

    def __str__(self):
        return " ZapConfigurationContext( " + str(self.get_configurations) + " )"
