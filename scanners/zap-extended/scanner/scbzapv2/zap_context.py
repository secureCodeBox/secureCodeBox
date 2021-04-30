import collections
import logging

import os
import sys
import json
import requests
import base64

from urllib.parse import urlparse
from zapv2 import ZAPv2

from .zap_configuration import ZapConfiguration

class ZapConfigureContext():
    """This class configures the context in running ZAP instance, based on a given ZAP Configuration.
    
    Based on this opensource ZAP Python example:
    - https://github.com/zaproxy/zap-api-python/blob/9bab9bf1862df389a32aab15ea4a910551ba5bfc/src/examples/zap_example_api_script.py
    
    """

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

        # if at least one ZAP Context is defined start to configure the running ZAP instance (`zap`) accordingly
        if self.__config.has_context_configurations:
            # Starting to configure the ZAP Instance based on the given context configurations
            self._configure_contexts(zap, config.get_contexts())
        else:
            logging.warning("No valid ZAP configuration object found: %s! It seems there is something important missing.", config)

    def _configure_contexts(self, zap: ZAPv2, contexts: list):
        """ Configures a given ZAP instance with the given list of contexts.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        contexts : list
            The list of context configuration objects (based on the class ZapConfiguration).
        """

        logging.debug('Configure #%s context(s) with: %s', len(contexts), contexts)

        # Remove all existing ZAP contexts 
        logging.warning("Existing Contexts will be removed: %s", zap.context.context_list)
        for remove_context in zap.context.context_list:
            zap.context.remove_context(contextname=remove_context)

        # Add all new ZAP contexts
        for context in contexts:
            logging.debug('Configure ZAP Context: ' + context["name"])
            context_id = zap.context.new_context(context["name"])
            context_name = context["name"]
            context["id"] = context_id

            if("includePaths" in context):
                self._configure_context_include(zap, context)
            if("excludePaths" in context):
                self._configure_context_exclude(zap, context)
            if("authentication" in context):
                self._configure_context_authentication(zap, context["authentication"], context_id)
                if("users" in context and "type" in context["authentication"] and context["authentication"]["type"]):
                    self._configure_context_create_users(zap, context["users"], context["authentication"]["type"], context_id)
                if("session" in context and "type" in context["session"] and context["session"]["type"]):
                    self._configure_context_session_management(zap, context["session"], context_id)
            if("technologies" in context):
                # TODO: Open a new ZAP GH Issue: Why (or) is this difference (context_id vs. context_name) here really necessary?
                self._configure_context_technologies(zap, context["technologies"], context_name)

    def _configure_context_include(self, zap: ZAPv2, context: collections.OrderedDict):
        """Protected method to configure the ZAP 'Context / Include Settings' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        contexts : collections.OrderedDict
            The zap configuration object containing the ZAP include configuration (based on the class ZapConfiguration).
        """

        if "includePaths" in context:
            for regex in context["includePaths"]:
                logging.debug("Including regex '%s' from context", regex)
                zap.context.include_in_context(contextname=context["name"], regex=regex)

    def _configure_context_exclude(self, zap: ZAPv2, context: collections.OrderedDict):
        """Protected method to configure the ZAP 'Context / Exclude Settings' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        contexts : collections.OrderedDict
            The current zap configuration object containing the ZAP exclude configuration (based on the class ZapConfiguration).
        """

        if "excludePaths" in context:
            for regex in context["excludePaths"]:
                logging.debug("Excluding regex '%s' from context", regex)
                zap.context.exclude_from_context(contextname=context["name"], regex=regex)

    def _configure_context_authentication(self, zap: ZAPv2, authentication: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        authentication : list
            The current authentication configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """
       
        auth_type = authentication["type"]

        if auth_type == "script-based":
            if( "script-based" in authentication ):
                self._configure_context_authentication_script(zap, authentication["script-based"], context_id)
        elif auth_type == "basic-auth":
            if("basic-auth" in authentication):
                self._configure_context_authentication_basic_auth(zap, authentication["basic-auth"], context_id)
        elif auth_type == "form-based":
            if("form-based" in authentication):
                self._configure_context_authentication_form_auth(zap, authentication["form-based"], context_id)
        elif auth_type == "json-based":
            if("json-based" in authentication):
                self._configure_context_authentication_json_auth(zap, authentication["json-based"], context_id)

        if "verification" in authentication:
            self._confige_auth_validation(zap, authentication["verification"], context_id)
        else:
            logging.info("No Authentication verification found :-/ are you sure? %s", script)
        
    def _configure_context_authentication_script(self, zap: ZAPv2, script: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with Script based Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        authentication : collections.OrderedDict
            The current 'script-based' authentication configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """
        
        if(script and "scriptName" in script and "scriptFile" in script and "scriptEngine" in script):
            self._configure_load_script(zap, script, context_id)

            # Create ZAP Script parameters based on given configruation object
            auth_params = [
                'scriptName=' + script["scriptName"],
            ]
            # Creates a list of URL-Encoded params, based on the YAML config
            for key, value in script["scriptArguments"].items():
                auth_params.append(key + "=" + value)
            # Add a '&' to all elements except the last one
            auth_params = '&'.join(auth_params)

            # Add additional script parameters
            logging.debug('Loading Authentication Script Parameters: %s', auth_params)
            auth_response = zap.authentication.set_authentication_method(
                contextid=context_id,
                authmethodname='scriptBasedAuthentication',
                authmethodconfigparams=auth_params)
            logging.debug("Auth_response for context_id: %s with response: %s, type: %s", context_id, auth_response, type(auth_response))

            if( "missing_parameter" in auth_response ):
                raise Exception("Missing ZAP Authentication Script Parameters! Please check your secureCoeBix YAML configuration!")
        else:
          logging.warning("Important authentiation configs are missing!")

    def _configure_context_authentication_basic_auth(self, zap: ZAPv2, basic_auth: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with Basic Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
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

            zap.authentication.set_authentication_method(
                contextid=context_id,
                authmethodname='httpAuthentication',
                authmethodconfigparams=auth_method_config_params)
    
    def _configure_context_authentication_form_auth(self, zap: ZAPv2, form_auth: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with Form Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
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

            logging.info("HTTP ZAP HTTP Form Params: '%s'", auth_method_config_params)

            zap.authentication.set_authentication_method(
                contextid=context_id,
                authmethodname='formBasedAuthentication',
                authmethodconfigparams=auth_method_config_params)

    def _configure_context_authentication_json_auth(self, zap: ZAPv2, json_auth: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with JSON Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
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

            zap.authentication.set_authentication_method(
                contextid=context_id,
                authmethodname='jsonBasedAuthentication',
                authmethodconfigparams=auth_method_config_params)

    def _confige_auth_validation(self, zap: ZAPv2, validation: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Authentication Settings with Script based Authentication' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        validation : collections.OrderedDict
            The current 'script-based' authentication configuration object containing the ZAP authentication configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """

        logging.debug('Configure Authentication Validation: %s', validation)
            
        if "isLoggedInIndicator" in validation:
            zap.authentication.set_logged_in_indicator(
                contextid=context_id,
                loggedinindicatorregex=validation["isLoggedInIndicator"])
        if "isLoggedOutIndicator" in validation:
            zap.authentication.set_logged_out_indicator(
                contextid=context_id,
                loggedoutindicatorregex=validation["isLoggedOutIndicator"])

    def _configure_context_create_users(self, zap: ZAPv2, users: collections.OrderedDict, auth_type: str, context_id: int):
        """Protected method to configure the ZAP 'Context / Users Settings' based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        users : collections.OrderedDict
            The current users (list) configuration object containing the ZAP users configuration (based on the class ZapConfiguration).
        auth_type: str
            The configured authentiation type (e.g.: "basic-auth", "form-based", "json-based", "script-based").
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """

        # Remove all existing ZAP Users for given context
        logging.warning("Existing Contexts will be removed: %s", zap.context.context_list)
        for user_id in zap.users.users_list(contextid=context_id):
            zap.users.remove_user(contextid=context_id, userid=user_id)

        # Add all new ZAP Users to given context
        for user in users:
            logging.debug("Adding ZAP User '%s', to context(%s)", user, context_id)
            user_name = user['username']
            user_password = user['password']
            
            user_id = zap.users.new_user(contextid=context_id, name=user_name)
            logging.debug("Created ZAP User(%s), for context(%s)", user_id, context_id)
            user['id'] = user_id
            
            zap.users.set_user_name(
                contextid=context_id, 
                userid=user_id, 
                name=user_name)

            # TODO: Open a new issue at ZAP GitHub: Why (or) is this difference (camelCase vs. pascalCase) here really necessary?
            if auth_type == "script-based":
                zap.users.set_authentication_credentials(
                    contextid=context_id,
                    userid=user_id,
                    authcredentialsconfigparams='Username=' + user_name + '&Password=' + user_password)
                zap.users.set_user_enabled(contextid=context_id, userid=user_id, enabled=True)
            else:
                zap.users.set_authentication_credentials(
                    contextid=context_id,
                    userid=user_id,
                    authcredentialsconfigparams='username=' + user_name + '&password=' + user_password)
                zap.users.set_user_enabled(contextid=context_id, userid=user_id, enabled=True)

            if ("forced" in user and user["forced"]):
                logging.debug("Configuring a forced user '%s' with id, for context(%s)'", user_id, context_id)
                zap.forcedUser.set_forced_user(contextid=context_id, userid=user_id)
                zap.forcedUser.set_forced_user_mode_enabled(True)

    def _configure_load_script(self, zap: ZAPv2, script: collections.OrderedDict, context_id: int):
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
        
        if(script and "scriptName" in script and "scriptFile" in script and "scriptEngine" in script):
            # Remove exisitng Script if already exisiting
            logging.debug("Removing Auth script '%s' at '%s'", script["scriptName"], script["scriptFile"])
            zap.script.remove(scriptname=script["scriptName"])

            # Add Script again
            logging.debug('Loading Authentication Script: %s', script["scriptFile"])
            response = zap.script.load(
                scriptname=script["scriptName"],
                scripttype='authentication',
                scriptengine=script["scriptEngine"],
                filename=script["scriptFile"],
                scriptdescription=script["scriptDescription"]
                )
            zap.script.enable(scriptname=script["scriptName"])
        else:
          logging.warning("Important script configuration values are missing! Please check your YAML configuration for mandatory parameters.")

    def _configure_context_session_management(self, zap: ZAPv2, sessions: collections.OrderedDict, context_id: int):
        """Protected method to configure the ZAP 'Context / Session Mannagement' Settings based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        sessions : collections.OrderedDict
            The current sessions configuration object containing the ZAP sessions configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """

        sessions_type = sessions["type"]
        if sessions_type == "cookieBasedSessionManagement":
            logging.debug("Configuring cookieBasedSessionManagement")
            zap.sessionManagement.set_session_management_method(
                contextid=context_id,
                methodname='cookieBasedSessionManagement')
        elif sessions_type == "httpAuthSessionManagement":
            logging.debug("Configuring httpAuthSessionManagement")
            zap.sessionManagement.set_session_management_method(
                contextid=context_id,
                methodname='httpAuthSessionManagement')
        elif sessions_type == "scriptBasedSessionManagement":
            logging.debug("Configuring scriptBasedSessionManagement")
            if("scriptBasedSessionManagement" in sessions and sessions["scriptBasedSessionManagement"]):
                self._configure_load_script(zap, sessions["scriptBasedSessionManagement"], context_id)
                # Here they say that only "cookieBasedSessionManagement"; "httpAuthSessionManagement"
                # is possible, but maybe this is outdated and it works anyway, hopefully:
                # https://github.com/zaproxy/zap-api-python/blob/9bab9bf1862df389a32aab15ea4a910551ba5bfc/src/examples/zap_example_api_script.py#L97
                session_params = ('scriptName=' + sessions["scriptBasedSessionManagement"]["scriptName"])
                zap.sessionManagement.set_session_management_method(
                    contextid=context_id,
                    methodname='scriptBasedSessionManagement',
                    methodconfigparams=session_params)

    def _configure_context_technologies(self, zap: ZAPv2, technology: collections.OrderedDict, context_name: str):
        """Protected method to configure the ZAP 'Context / Technology' Settings based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        technology : collections.OrderedDict
            The current technology configuration object containing the ZAP technology configuration (based on the class ZapConfiguration).
        context_id : int
            The zap context id tot configure the ZAP authentication for (based on the class ZapConfiguration).
        """

        if(technology):
            # Remove all existing ZAP Users for given context
            #logging.warning("Existing technologies ' %s' will be removed for context: %s", zap.context.technology_list, context_name)
            #zap.context.exclude_all_context_technologies(contextname=context_name)
            
            if "included" in technology:
                technologies = ", ".join(technology["included"])
                logging.debug("Include technologies '%s' in context with name %s", technologies, context_name)
                zap.context.include_context_technologies(contextname=context_name, technologynames=technologies)
            
            if "excluded" in technology:
                technologies = ", ".join(technology["included"])
                logging.debug("Exclude technologies '%s' in context with name %s", technologies, context_name)
                zap.context.exclude_context_technologies(contextname=context_name, technologynames=technologies)
