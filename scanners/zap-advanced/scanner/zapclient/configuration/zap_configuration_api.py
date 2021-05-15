#!/usr/bin/env python
# -*- coding: utf-8 -*-

import collections
import logging

from .zap_configuration_list import ZapConfigurationList

class ZapConfigurationApi(ZapConfigurationList):
    """This class represent a ZAP specific for ZAP API configurations based on a given YAML file."""
    
    def __init__(self, api_configurations: collections.OrderedDict):
        """Initial constructor used for this class
        
        Parameters
        ----------
        api_configurations : collections.OrderedDict
            The relative path to the config dir containing all relevant config YAML files.
        """
        super().__init__(api_configurations, "api", "apis")

    def __str__(self):
        return " ZapConfigurationApi( " + str(self.get_configurations) + " )"
