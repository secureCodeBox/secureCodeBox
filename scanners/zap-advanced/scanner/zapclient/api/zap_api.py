#!/usr/bin/env python

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import json
import requests
import collections
import logging

from urllib.parse import urlparse
from zapv2 import ZAPv2

from .. import ZapClient
from ..configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureApi')

class ZapConfigureApi(ZapClient):
    """This class configures a Api scan in a running ZAP instance, based on a ZAP Configuration.
    
    Based on this opensource ZAP Python example:
    - https://github.com/zaproxy/zap-api-python/blob/9bab9bf1862df389a32aab15ea4a910551ba5bfc/src/examples/zap_example_api_script.py
    """

    def __init__(self, zap: ZAPv2, config: ZapConfiguration):
        """Initial constructor used for this class.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        config : ZapConfiguration
            The configuration object containing all ZAP configs (based on the class ZapConfiguration).
        """

        super().__init__(zap, config)
        
        self.__api_config = None

        # if at least one ZAP Context is defined start to configure the running ZAP instance (`zap`) accordingly
        if self.get_config.has_configurations and self.get_config.get_apis.has_configurations:
            logging.debug('Configure #%s APIs(s) with: %s', len(self.get_config.get_apis.get_configurations), self.get_config.get_apis.get_configurations)
        else:
            logging.warning("No valid ZAP configuration object found: %s! It seems there is something important missing.", config)

    @property
    def get_api_config(self) -> collections.OrderedDict:
        """ Returns the spider config of the currently running ZAP instance. """
        return self.__api_config
    
    def start_api_by_url(self, url: str):
        """ Starts a ZAP Api scan for the given target, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        url: str
            The target to Api.
        """

        if self.get_config.get_apis.has_configurations:
            # Search for the corresponding context object related to the given url
            api_context=self.get_config.get_contexts.get_configuration_by_url(url)
            # Search for a API configuration referencing the context identified by url
            if self._is_not_empty_string("name", api_context):
                self.__api_config = self.get_config.get_apis.get_configuration_by_context_name(str(api_context["name"]))

                logging.info("Trying to start API Import with target url: '%s'", url)
                self.__load_api(url=url, api_config=self.__api_config)
            else:
                logging.warning("No context configuration found for target: %s!", url)
        else:
            logging.error("There is no API configuration section defined in your configuration YAML.")

    def __load_api(self, url: str, api_config: collections.OrderedDict):
        
        if (api_config is not None) and "format" in api_config and api_config["format"] == 'openapi' and "url" in api_config:
            logging.debug('Import Api URL ' + api_config["url"])
            result = self.get_zap.openapi.import_url(api_config["url"], api_config["hostOverride"])
            urls = self.get_zap.core.urls()
            
            logging.info('Number of Imported URLs: ' + str(len(urls)))
            logging.debug('Import warnings: ' + str(result))
        else:
            logging.info("No complete API definition configured (format: openapi, url: xxx): %s!", api_config)
        
        logging.debug('Trying to configure the API Scan')
        self.configure_scripts(config=api_config)
