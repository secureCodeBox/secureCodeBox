import os
import sys
import time
import json
import requests
import base64
import collections
import logging

from urllib.parse import urlparse
from zapv2 import ZAPv2

from .zap_configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureGlobal')

class ZapConfigureGlobal():
    """This class configures a running ZAP instance, based on a ZAP Global Configuration
    
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
        self.__global_config = None

        if self.__config.has_global_configurations():
            self.__global_config = self.__config.get_global()

            logging.debug("Found the following ZAP Global config: %s", self.get_global_config)

            if "isNewSession" in self.get_global_config:
                self.__create_session(str(self.get_global_config["sessionName"]))
            else:
                self.__create_session("secureCodeBox")
            
            self.__configure_global()
            self.__configure_exclude_paths()

            if "proxy" in self.get_global_config:
                self.__configure_proxy(self.get_global_config["proxy"])
            else:
                logging.debug("No ZAP Global Proxy Configuration found")
            
            if "scripts" in self.get_global_config:
                self.__show_all_scripts()
                for script in self.get_global_config["scripts"]:
                    logging.debug("Configuring Script: '%s'", script["name"])
                    self.__configure_load_script(script_config=script)
                self.__show_all_scripts()

    @property
    def get_config(self) -> ZapConfiguration:
        """ Returns the complete config of the currently running ZAP instance."""
        return self.__config

    @property
    def get_zap(self) -> ZAPv2:
        """ Returns the currently running ZAP instance."""
        return self.__zap

    @property
    def get_global_config(self) -> collections.OrderedDict:
        """ Returns the global config of the currently running ZAP instance."""
        return self.__global_config

    def __create_session(self, session_name:str):
        """Private method to configure a new active ZAP Session with the given name.
        
        Parameters
        ----------
        session_name : str
            The name of the new active ZAP Session to create.
        """
        
        # Start the ZAP session
        logging.info('Creating a new ZAP session with the name: %s', session_name)
        self.__check_zap_result(
            result=self.__zap.core.new_session(name=session_name, overwrite=True),
            method="new_session()"
        )

        # Wait for ZAP to update the internal caches 
        time.sleep(5)
    
    def __configure_exclude_paths(self):
        """Private method to configure the ZAP Global 'Proxy Settings' based on a given ZAP config. """

        if "globalExcludePaths" in self.get_global_config:
            for regex in self.get_global_config["globalExcludePaths"]:
                logging.debug("Excluding regex '%s' from global proxy setting", regex)
                self.__check_zap_result(
                    result=self.get_zap.core.exclude_from_proxy(regex=regex),
                    method="exclude_from_proxy"
                )
    
    def __configure_proxy(self, proxy_config: collections.OrderedDict):
        """Private method to configure the ZAP Global 'Proxy Settings' based on a given ZAP config.
        
        Parameters
        ----------
        proxy_config : collections.OrderedDict
            The current zap global proxy configuration object containing the ZAP Proxy configurations (based on the class ZapConfiguration).
        """

        if "enabled" in proxy_config and proxy_config["enabled"]:

            self.__check_zap_result(
                result=self.get_zap.core.set_option_use_proxy_chain(boolean=str(proxy_config["enabled"]).lower()),
                method="set_option_use_proxy_chain"
            )

            if "address" in proxy_config and (proxy_config['address'] is not None) and len(proxy_config['address']) > 0:
                self.__check_zap_result(
                    result=self.get_zap.core.set_option_proxy_chain_name(string=str(proxy_config['address'])), 
                    method="set_option_proxy_chain_name"
                )
            if "port" in proxy_config and (proxy_config['port'] is not None) and proxy_config['port'] > 0:
                self.__check_zap_result(
                    result=self.get_zap.core.set_option_proxy_chain_port(integer=str(proxy_config['port'])), 
                    method="set_option_proxy_chain_port"
                )
            if "skipProxyAddresses" in proxy_config and (proxy_config['skipProxyAddresses'] is not None):
                logging.debug("Disabling all possible pre existing proxy excluded domains before adding new ones.")
                self.__check_zap_result(
                    result=self.get_zap.core.disable_all_proxy_chain_excluded_domains(),
                    method="add_proxy_chain_excluded_domain"
                )
                for address in proxy_config["skipProxyAddresses"]:
                    logging.debug("Excluding (skip) address '%s' from global proxy setting", address)
                    self.__check_zap_result(
                        result=self.get_zap.core.add_proxy_chain_excluded_domain(value=address, isregex=True, isenabled=True),
                        method="add_proxy_chain_excluded_domain"
                    )
            # Configure ZAP outgoing proxy server authentication
            if "authentication" in proxy_config and (proxy_config['authentication'] is not None):
                proxy_authentication_config = proxy_config['authentication']
                
                if "enabled" in proxy_authentication_config and proxy_authentication_config["enabled"]:
                    self.__check_zap_result(
                            result=self.get_zap.core.set_option_use_proxy_chain_auth(boolean=str(proxy_authentication_config["enabled"]).lower()),
                            method="set_option_use_proxy_chain_auth"
                        )
                    if "username" in proxy_authentication_config and (proxy_authentication_config['username'] is not None) and len(proxy_authentication_config['username']) > 0:
                        self.__check_zap_result(
                            result=self.get_zap.core.set_option_proxy_chain_user_name(string=str(proxy_authentication_config['username'])), 
                            method="set_option_proxy_chain_user_name"
                        )
                    if "password" in proxy_authentication_config and (proxy_authentication_config['password'] is not None) and len(proxy_authentication_config['password']) > 0:
                        self.__check_zap_result(
                            result=self.get_zap.core.set_option_proxy_chain_password(string=str(proxy_authentication_config['password'])), 
                            method="set_option_proxy_chain_password"
                        )
                    if "realm" in proxy_authentication_config and (proxy_authentication_config['realm'] is not None) and len(proxy_authentication_config['realm']) > 0:
                        self.__check_zap_result(
                            result=self.get_zap.core.set_option_proxy_chain_realm(string=str(proxy_authentication_config['realm'])), 
                            method="set_option_proxy_chain_realm"
                        )
            
            # Configure ZAP outgoing proxy server authentication
            if "socks" in proxy_config and (proxy_config['socks'] is not None):
                socks_config = proxy_config['socks']
                
                if "enabled" in socks_config and socks_config["enabled"]:
                    self.__check_zap_result(
                        result=self.get_zap.core.set_option_use_socks_proxy(boolean=str(socks_config["enabled"]).lower()),
                        method="set_option_use_socks_proxy"
                    )

    def __configure_global(self):
        """ Configures some global ZAP Configurations, based on the running ZAP instance and given config YAML"""

        logging.debug('Trying to configure the ZAP Global Settings')
            
        # Configure ActiveScan (ajax or http)
        
        if "timeoutInSeconds" in self.get_global_config and (self.get_global_config['timeoutInSeconds'] is not None) and self.get_global_config['timeoutInSeconds'] >= 0:
            self.__check_zap_result(
                result=self.get_zap.core.set_option_timeout_in_secs(str(self.get_global_config['timeoutInSeconds'])), 
                method="set_option_timeout_in_secs"
            )
        if "defaultUserAgent" in self.get_global_config and (self.get_global_config['defaultUserAgent'] is not None) and len(self.get_global_config['defaultUserAgent']) > 0:
            self.__check_zap_result(
                result=self.get_zap.core.set_option_default_user_agent(str(self.get_global_config['defaultUserAgent'])), 
                method="set_option_default_user_agent"
            )
        if "mode" in self.get_global_config and (self.get_global_config['mode'] is not None) and len(self.get_global_config['mode']) > 0:
            self.__check_zap_result(
                result=self.get_zap.core.set_mode(str(self.get_global_config['mode'])), 
                method="set_mode"
            )
        
    def __configure_load_script(self, script_config: collections.OrderedDict):
        """Protected method to load a new ZAP Script based on a given ZAP config.
        
        Parameters
        ----------
        zap : ZAPv2
            The running ZAP instance to configure.
        script_config : collections.OrderedDict
            The current 'script'  configuration object containing the ZAP script configuration (based on the class ZapConfiguration).
        """
        
        if((script_config is not None) and "name" in script_config):

            # Only try to add new scripts if the definition contains all nessesary config options, otherwise try to only activate/deactivate a given script name
            if("filePath" in script_config and "engine" in script_config and "type" in script_config):
                # Remove existing Script, if already pre-existing
                logging.debug("Trying to remove pre-existing Script '%s' at '%s'", script_config["name"], script_config["filePath"])
                self.get_zap.script.remove(scriptname=script_config["name"])

                # Add Script again
                logging.info("Loading new Authentication Script '%s' at '%s' with type: '%s' and engine '%s'", script_config["name"], script_config["filePath"], script_config["type"], script_config["engine"])
                response = self.get_zap.script.load(
                    scriptname=script_config["name"],
                    scripttype=script_config["type"],
                    scriptengine=script_config["engine"],
                    filename=script_config["filePath"],
                    scriptdescription=script_config["description"]
                )
                
                if response != "OK":
                    logging.warning("Script Response: %s", response)
                    raise RuntimeError("The script (%s) couldn't be loaded due to errors: %s", script_config, response)

            logging.info("Activating Script '%s' with 'enabled: %s'", script_config["name"], str(script_config["enabled"]).lower())
            if(script_config["enabled"]):
                self.__check_zap_result(
                    result=self.get_zap.script.enable(scriptname=script_config["name"]),
                    method="script.enable"
                )
            else:
                self.__check_zap_result(
                    result=self.get_zap.script.disable(scriptname=script_config["name"]),
                    method="script.disable"
                )
        else:
          logging.warning("Important script configs (scriptName, scriptType, scriptFilePath, scriptEngine) are missing! Ignoring the script configuration. Please check your YAML configuration.")

    def __show_all_scripts(self):
        for scripts in self.get_zap.script.list_scripts:
            logging.debug(scripts)

    def __check_zap_result(self, result: str, method: str):
        """ Checks the given result for ZAP Errors and logs warning messages if there are errors returned by ZAP.
        
        Parameters
        ----------
        result: str
            The result of an ZAP Call.
        method: str
            The name of the method used (to call ZAP).
        """
        
        if "OK" != result:
            logging.warning("Failed to configure ZAP Global ['%s'], result is: '%s'", method, result)
        else:
            logging.debug("Successfull configured ZAP Global ['%s'], result is: '%s'", method, result)