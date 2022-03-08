#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import json
import urllib

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
        if self.get_config.has_configurations and self.get_config.get_active_api_config is not None:
            logging.debug(
                'Configure API Import with: %s',
                self.get_config.get_active_api_config
            )
        else:
            logging.warning("No valid ZAP configuration object found: %s! It seems there is something important missing.", config)

    @property
    def get_api_config(self) -> collections.OrderedDict:
        """ Returns the spider config of the currently running ZAP instance. """
        return self.__api_config
    
    def start_api_import(self, url: str, context: collections.OrderedDict, api_config: collections.OrderedDict):
        """ Starts a ZAP Api scan for the given target, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        url: str
            The target to Api.
        context:
            The active context for the current scan / api import
        api_config:
            Active api_config that should be used for the api import
        """

        logging.debug('Trying to configure the API Scan')
        self.configure_scripts(config=api_config)

        logging.info("Trying to start API Import with target url: '%s'", url)

        if (api_config is None) or "format" not in api_config or api_config["format"] != 'openapi':
            logging.info("No complete API definition configured (format: openapi): %s!", api_config)
            return

        if "url" not in api_config and "path" not in api_config:
            logging.warning(
                "API Config section '%s' has neither a 'url' or a 'path' configured. It will be skipped",
                api_config["name"]
            )
            return

        api_spec_url = None

        if "url" in api_config:
            api_spec_url = api_config["url"]
        elif "path" in api_config:
            logging.info('Building OpenAPI Spec from path (%s) and the target url (%s)', api_config["path"], url)
            api_spec_url = urllib.parse.urlparse(url)._replace(path=api_config["path"]).geturl()

        logging.info('Import OpenAPI Spec from (%s)', api_spec_url)
        if "hostOverride" in api_config:
            result = self.get_zap.openapi.import_url(api_spec_url, api_config["hostOverride"])
        else:
            logging.warning("No 'hostOverride' configured for target %s. Defaulting for target as override.", url)
            result = self.get_zap.openapi.import_url(api_spec_url, url)

        urls = self.get_zap.core.urls()
        logging.info('Number of Imported URLs: %d', len(urls))
        logging.debug('Import warnings: %s', str(result))
