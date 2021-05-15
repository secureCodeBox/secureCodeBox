#!/usr/bin/env python
# -*- coding: utf-8 -*-

import collections
import logging

from abc import ABC, abstractmethod
from zapv2 import ZAPv2

from .configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapClient')

class ZapClient(ABC):
    """This abstract class configures a ZAP Client using in a running ZAP instance."""

    def __init__(self, zap: ZAPv2, config: ZapConfiguration):
        """Initial constructor used for this class
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        config : ZapConfiguration
            The configuration object containing all ZAP configs (based on the class ZapConfiguration).
        """
        
        self.__zap = zap
        self.__config = config
    
    @property
    def get_config(self) -> ZapConfiguration:
        """ Returns the complete config of the currently running ZAP instance. """
        return self.__config

    @property
    def get_zap(self) -> ZAPv2:
        """ Returns the currently running ZAP instance. """
        return self.__zap
    
    def check_zap_result(self, result: str, method_name: str, exception_message=None) -> bool:
        """ Checks the given result for ZAP API Call for errors and logs a warning messages if there are errors returened by ZAP.
        
        Parameters
        ----------
        result: str
            The result of a ZAP API Call.
        method_name: str
            The name of the method used (to call ZAP) used to log a warning, if the given result is not "OK".
        exception_message: str
            The exception message that mus be thrown with an Exception, if the given result is not "OK".
        """

        __result = False
        
        if "OK" != result:
            __result = False
            if(exception_message is not None):
                logging.error(exception_message)
                raise Exception(exception_message)
            else:
                logging.warning("Failed to call ZAP Method ['%s'], result is: '%s'", method_name, result)
        else:
            logging.debug("Successfull called ZAP Method ['%s'], result is: '%s'", method_name, result)
            __result = True

        return __result
    
    def _configure_load_script(self, script_config: collections.OrderedDict, script_type: str):
        """Protected method to load a new ZAP Script based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        script : collections.OrderedDict
            The current 'script'  configuration object containing the ZAP script configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """
        
        if((script_config is not None) and "scriptName" in script_config and "scriptFilePath" in script_config and "scriptEngine" in script_config):
            # Remove exisitng Script if already exisiting
            logging.debug("Removing pre-existing Auth script '%s' at '%s'", script_config["scriptName"], script_config["scriptFilePath"])
            self.get_zap.script.remove(scriptname=script_config["scriptName"])

            # Add Script again
            logging.debug("Loading Authentication Script '%s' at '%s' with type: '%s' and engine '%s'", script_config["scriptName"], script_config["scriptFilePath"], script_type, script_config["scriptEngine"])
            response = self.get_zap.script.load(
                scriptname=script_config["scriptName"],
                scripttype=script_type,
                scriptengine=script_config["scriptEngine"],
                filename=script_config["scriptFilePath"],
                scriptdescription=script_config["scriptDescription"]
                )
            
            if response != "OK":
                logging.warning("Script Response: %s", response)
                raise RuntimeError("The script (%s) couldn't be loaded due to errors: %s", script_config, response)

            self.get_zap.script.enable(scriptname=script_config["scriptName"])

            self._log_all_scripts()
        else:
          logging.warning("Important script configs (scriptName, scriptFilePath, scriptEngine) are missing! Ignoring the script configuration. Please check your YAML configuration.")

    def _log_all_scripts(self):
        """Protected method to log all currently configured ZAP Scripts."""
        
        for scripts in self.get_zap.script.list_scripts:
            logging.debug(scripts)
    
    def _is_not_empty(self, item_name: str, config: collections.OrderedDict) -> bool:
        """Return True if the item with the name 'item_name' is exisiting and not None, otherwise false."""
        result = False
        if item_name in config and (config[item_name] is not None):
            result = True
        return result

    def _is_not_empty_integer(self, item_name: str, config: collections.OrderedDict) -> bool:
        """Return True if the item with the name 'item_name' is exisiting and a valid integer >= 0, otherwise false."""
        result = False
        if self._is_not_empty(item_name, config) and isinstance(config[item_name], int) and config[item_name] >= 0:
            result = True
        return result
    
    def _is_not_empty_string(self, item_name: str, config: collections.OrderedDict) -> bool:
        """Return True if the item with the name 'item_name' is exisiting and a valid string with len() >= 0, otherwise false."""
        result = False
        if self._is_not_empty(item_name, config) and isinstance(config[item_name], str) and len(config[item_name]) > 0:
            result = True
        return result
    
    def _is_not_empty_bool(self, item_name: str, config: collections.OrderedDict) -> bool:
        """Return True if the item with the name 'item_name' is exisiting and a valid bool, otherwise false."""
        result = False
        if self._is_not_empty(item_name, config) and isinstance(config[item_name], bool):
            result = True
        return result