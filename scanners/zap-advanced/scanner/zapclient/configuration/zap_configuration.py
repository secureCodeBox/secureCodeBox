#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import collections
import logging
import glob
import hiyapyco

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapClient')


class ZapConfiguration:
    """This class represent a ZAP specific configuration based on a given YAML file."""

    def __init__(self, config_dir: str, target: str, forced_context: str = None):
        """Initial constructor used for this class
        
        Parameters
        ----------
        config_dir : str
            The relative path to the config dir containing all relevant config YAML files.
        """

        self.config_dir = config_dir
        self.config_dir_glob = config_dir + "*.yaml"
        self.target = target
        self.forced_context = forced_context


        self.__config = collections.OrderedDict()
        self.__read_config_files()

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
        else:
            logging.warning("No ZAP YAML Configuration files found :-/ This is no problem but possibly not intendend here.")
            self.__config = collections.OrderedDict()

    @property
    def has_configurations(self) -> bool:
        """Returns true if any ZAP Configuration is defined, otherwise false."""

        return (self.__config is not None) and len(self.__config) > 0

    @property
    def get_configurations(self) -> collections.OrderedDict:
        """Returns the complete ZAP Configuration object"""

        return self.__config

    def has_global_configurations(self) -> bool:
        """Returns true if any ZAP Global Configuration is defined, otherwise false."""

        return self.has_configurations and "global" in self.get_configurations

    @property
    def get_global(self) -> collections.OrderedDict:
        """Returns the complete ZAP Configuration object"""
        result = collections.OrderedDict()

        if self.has_global_configurations():
            result = self.get_configurations["global"]

        return result

    @property
    def get_all_contexts(self) -> list[collections.OrderedDict]:
        return self.__config["contexts"] if "contexts" in self.__config else []

    def _get_active_config_from(self, configs: collections.OrderedDict, key: str):
        """Returns the active configuration by matching url or context

        Parameters
        ----------
        configs: list[collections.OrderedDict]
            All configs available for this config type. E.g. all spider configs.
        key: str
            The key of the config object, e.g.
        """
        if configs is None:
            logging.warning(
                "Config is not defined!",
            )
            return None
        if not isinstance(configs, collections.OrderedDict):
            logging.warning(
                "Config should be a map!",
            )
            return None
        if key not in configs:
            logging.warning(
                "No %s config found in the config.!",
                key
            )
            return None

        if self.forced_context is not None:
            # if this method is getting a context,
            # search for the "name" key to match. Otherwise search for for the "context" attribute
            look_for = "name" if key == "contexts" else "context"
            for configuration in configs[key]:
                if look_for in configuration and configuration[look_for] == self.forced_context:
                    return configuration

            logging.warning(
                "No %s specific configuration found using for the configured context (%s)!",
                key,
                self.forced_context
            )
        else:
            for configuration in configs[key]:
                if "url" in configuration and configuration["url"].startswith(self.target):
                    return configuration

            logging.warning(
                "No %s specific configuration found using the given target url (%s)!",
                key,
                self.target
            )
        return None

    @property
    def get_active_context_config(self) -> collections.OrderedDict:
        return self._get_active_config_from(self.get_configurations, "contexts")

    @property
    def get_active_api_config(self) -> collections.OrderedDict:
        return self._get_active_config_from(self.get_configurations, "apis")

    @property
    def get_active_spider_config(self) -> collections.OrderedDict:
        return self._get_active_config_from(self.get_configurations, "spiders")

    @property
    def get_active_scanner_config(self) -> collections.OrderedDict:
        return self._get_active_config_from(self.get_configurations, "scanners")

    def __str__(self):
        return " ZapConfiguration( " + str(self.get_configurations) + " )"
