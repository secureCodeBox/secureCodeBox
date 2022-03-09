#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import collections
import logging

from zapv2 import ZAPv2

from .. import ZapClient
from ..configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureContextAuthentication')


class ZapConfigureContextAuthentication(ZapClient):
    """This class configures the context in running ZAP instance, based on a given ZAP Configuration."""

    def __init__(self, zap: ZAPv2, config: ZapConfiguration):
        """Initial constructor used for this class
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        config : ZapConfiguration
            The configuration object containing all ZAP configs (based on the class ZapConfiguration).
        """
        
        super().__init__(zap, config) 
        
    def configure_context_authentication(self, context: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings' based on a given ZAP config.
        
        Parameters
        ----------
        context: collections.OrderedDict
            The current configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """
        
        authentication = context["authentication"]
        auth_type = authentication["type"]

        if auth_type == "script-based" and "script-based" in authentication:
            self._configure_context_authentication_script(authentication["script-based"], context_id)
        elif auth_type == "basic-auth" and "basic-auth" in authentication:
            self._configure_context_authentication_basic_auth(authentication["basic-auth"], context_id)
        elif auth_type == "form-based" and "form-based" in authentication:
            self._configure_context_authentication_form_auth(authentication["form-based"], context_id)
        elif auth_type == "json-based" and "json-based" in authentication:
            self._configure_context_authentication_json_auth(authentication["json-based"], context_id)

        if self._is_not_empty("verification", authentication):
            self._configure_auth_validation(authentication["verification"], context_id)
        
    def _configure_context_authentication_script(self, script_config: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with Script based Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        script_config : collections.OrderedDict
            The current 'script-based' authentication configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """
        
        if(not script_config == None and "name" in script_config and "filePath" in script_config and "engine" in script_config):
            self._configure_load_script(script_config=script_config, script_type='authentication')

            auth_params = self.__get_script_auth_params(script_config)

            # Add additional script parameters
            logging.debug('Loading Authentication Script Parameters: %s', auth_params)
            self.check_zap_result(
                result=self.get_zap.authentication.set_authentication_method(
                    contextid=context_id,
                    authmethodname='scriptBasedAuthentication',
                    authmethodconfigparams=auth_params),
                method_name="set_authentication_method",
                exception_message="Missing ZAP Authentication Script Parameters! Please check your secureCodeBox YAML configuration!"
            )
        else:
          logging.warning("Important script authentication configs (name, filePath, engine) are missing! Ignoring the authentication script configuration. Please check your YAML configuration.")

    def _configure_context_authentication_basic_auth(self, basic_auth: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with Basic Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        basic_auth : collections.OrderedDict
            The current 'basic-auth' authentication configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """
        
        logging.debug("Enabling ZAP HTTP Basic Auth")

        if "hostname" in basic_auth:
            auth_method_config_params = "hostname=" + basic_auth["hostname"] 
            if "realm" in basic_auth:
                auth_method_config_params += "&realm=" + basic_auth["realm"]
            if "port" in basic_auth:
                auth_method_config_params += "&port=" + str(basic_auth["port"])

            logging.info("HTTP BasicAuth Params: '%s'", auth_method_config_params)

            self.get_zap.authentication.set_authentication_method(
                contextid=context_id,
                authmethodname='httpAuthentication',
                authmethodconfigparams=auth_method_config_params)
    
    def _configure_context_authentication_form_auth(self, form_auth: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with Form Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        form_auth : collections.OrderedDict
            The current 'form-auth' authentication configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """
        
        logging.debug("Enabling ZAP HTTP Form based Authentication")

        if "loginUrl" in form_auth:
            auth_method_config_params = "loginUrl=" + form_auth["loginUrl"] 
            if "loginRequestData" in form_auth:
                auth_method_config_params += "&loginRequestData=" + form_auth["loginRequestData"]

            logging.debug("HTTP ZAP HTTP Form Params: '%s'", auth_method_config_params)

            self.get_zap.authentication.set_authentication_method(
                contextid=context_id,
                authmethodname='formBasedAuthentication',
                authmethodconfigparams=auth_method_config_params)

    def _configure_context_authentication_json_auth(self, json_auth: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with JSON Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        json_auth : collections.OrderedDict
            The current 'json-auth' authentication configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """
        
        logging.debug("Enabling ZAP HTTP Form based Authentication")

        if "loginUrl" in json_auth:
            auth_method_config_params = "loginUrl=" + json_auth["loginUrl"] 
            if "loginRequestData" in json_auth:
                auth_method_config_params += "&loginRequestData=" + json_auth["loginRequestData"]

            logging.info("HTTP ZAP HTTP JSON Params: '%s'", auth_method_config_params)

            self.get_zap.authentication.set_authentication_method(
                contextid=context_id,
                authmethodname='jsonBasedAuthentication',
                authmethodconfigparams=auth_method_config_params)

    def _configure_auth_validation(self, validation: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with Script based Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        validation : collections.OrderedDict
            The current 'script-based' authentication configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """

        logging.debug('Configure Authentication Validation: %s', validation)
            
        if "isLoggedInIndicator" in validation:
            self.get_zap.authentication.set_logged_in_indicator(
                contextid=context_id,
                loggedinindicatorregex=validation["isLoggedInIndicator"])
        if "isLoggedOutIndicator" in validation:
            self.get_zap.authentication.set_logged_out_indicator(
                contextid=context_id,
                loggedoutindicatorregex=validation["isLoggedOutIndicator"])

    def __get_script_auth_params(self, script_config: collections.OrderedDict) -> list:
        """Protected method to configure the ZAP 'Context / Authentication Settings with JSON Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        json_auth : collections.OrderedDict
            The current 'json-auth' authentication configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """

        # Create ZAP Script parameters based on given configuration object
        auth_params = ['scriptName=' + script_config["name"],]
        # Creates a list of URL-Encoded params, based on the YAML config
        for key, value in script_config["arguments"].items():
            auth_params.append(key + "=" + value)
        # Add a '&' to all elements except the last one
        auth_params = '&'.join(auth_params)

        return auth_params
