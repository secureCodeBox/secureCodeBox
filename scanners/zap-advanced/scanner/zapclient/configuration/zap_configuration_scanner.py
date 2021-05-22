#!/usr/bin/env python

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import collections
import logging

from .zap_configuration_list import ZapConfigurationList

class ZapConfigurationScanner(ZapConfigurationList):
    """This class represent a ZAP specific for ZAP Scanner configurations based on a given YAML file."""
    
    def __init__(self, scanner_configurations: collections.OrderedDict):
        """Initial constructor used for this class
        
        Parameters
        ----------
        scanner_configurations : str
            The relative path to the config dir containing all relevant config YAML files.
        """
        super().__init__(scanner_configurations, "scanner", "scanners")

    def __str__(self):
        return " ZapConfigurationScanner( " + str(self.get_configurations) + " )"
