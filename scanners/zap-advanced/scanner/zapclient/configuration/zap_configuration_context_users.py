#!/usr/bin/env python
# -*- coding: utf-8 -*-

import collections

from .zap_configuration_list import ZapConfigurationList

class ZapConfigurationContextUsers(ZapConfigurationList):
    """This class represent a ZAP specific for ZAP Context User configurations based on a given YAML file."""
    
    def __init__(self, context_configurations: collections.OrderedDict):
        """Initial constructor used for this class
        
        Parameters
        ----------
        context_configurations : str
            The relative path to the config dir containing all relevant config YAML files.
        """
        super().__init__(context_configurations, "user", "contexts.[].users")

    def __str__(self):
        return " ZapConfigurationContext( " + str(self.get_configurations) + " )"
