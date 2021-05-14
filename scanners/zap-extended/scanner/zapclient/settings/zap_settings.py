#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
import collections
import logging

from zapv2 import ZAPv2

from .. import ZapClient
from ..configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureGlobal')

class ZapConfigureSettings(ZapClient):
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
        
        super().__init__(zap, config)
        
        self.__global_config = None

        if self.get_config.has_global_configurations():
            self.__global_config = self.get_config.get_global()
            logging.debug("Found the following ZAP Global config: %s", self.get_global_config)
        else:
            logging.debug("No ZAP settings defined!")

    @property
    def get_global_config(self) -> collections.OrderedDict:
        """ Returns the global config of the currently running ZAP instance."""
        return self.__global_config
    
    def configure(self):
        """Configure a new active ZAP Session with all Settings, based on the configuration settings."""
        
        if self.get_config.has_global_configurations():
            self.__create_session()
            self.__configure_global_settings()
            self.__configure_exclude_paths()
            self.__configure_proxy()        
            self.__configure_scripts()

    def __create_session(self):
        """Private method to configure a new active ZAP Session, based on the configuration settings."""

        session_name = "secureCodeBox"

        if self.get_config.has_global_configurations() and "sessionName" in self.get_global_config and len(self.get_global_config["sessionName"]) > 0:
            session_name = self.get_global_config["sessionName"]

        # Start the ZAP session
        logging.info('Creating a new ZAP session with the name: %s', session_name)
        self.check_zap_result(
            result=self.get_zap.core.new_session(name=session_name, overwrite=True),
            method_name="new_session()"
        )

        # Wait for ZAP to update the internal caches 
        time.sleep(5)

    def __configure_global_settings(self):
        """ Configures some global ZAP Configurations, based on the running ZAP instance and given config YAML"""

        logging.debug('Trying to configure the ZAP Global Settings')
            
        # Configure ActiveScan (ajax or http)
        
        if "timeoutInSeconds" in self.get_global_config and (self.get_global_config['timeoutInSeconds'] is not None) and self.get_global_config['timeoutInSeconds'] >= 0:
            self.check_zap_result(
                result=self.get_zap.core.set_option_timeout_in_secs(str(self.get_global_config['timeoutInSeconds'])), 
                method_name="set_option_timeout_in_secs"
            )
        if "defaultUserAgent" in self.get_global_config and (self.get_global_config['defaultUserAgent'] is not None) and len(self.get_global_config['defaultUserAgent']) > 0:
            self.check_zap_result(
                result=self.get_zap.core.set_option_default_user_agent(str(self.get_global_config['defaultUserAgent'])), 
                method_name="set_option_default_user_agent"
            )
        if "mode" in self.get_global_config and (self.get_global_config['mode'] is not None) and len(self.get_global_config['mode']) > 0:
            self.check_zap_result(
                result=self.get_zap.core.set_mode(str(self.get_global_config['mode'])), 
                method_name="set_mode"
            )

    def __configure_exclude_paths(self):
        """Private method to configure the ZAP Global 'Proxy Settings' based on a given ZAP config. """

        if "globalExcludePaths" in self.get_global_config:
            for regex in self.get_global_config["globalExcludePaths"]:
                logging.debug("Excluding regex '%s' from global proxy setting", regex)
                self.check_zap_result(
                    result=self.get_zap.core.exclude_from_proxy(regex=regex),
                    method_name="exclude_from_proxy"
                )
        else:
            logging.debug("No global exclude paths configuration defined (global.globalExcludePaths: ).")

    def __configure_proxy(self):
        """Private method to configure the ZAP Global 'Proxy Settings' based on a given ZAP config."""

        if "proxy" in self.get_global_config:
            proxy_config = self.get_global_config["proxy"]

            if "enabled" in proxy_config and proxy_config["enabled"]:

                self.check_zap_result(
                    result=self.get_zap.core.set_option_use_proxy_chain(boolean=str(proxy_config["enabled"]).lower()),
                    method_name="set_option_use_proxy_chain"
                )
                self.__configure_proxy_settings(proxy_config)
                self.__configure_proxy_authentication(proxy_config)
                self.__configure_socks(proxy_config)
            else:
                logging.debug("Proxy configuration is not enabled (global.proxy.enabled: true)")
        else:
            logging.debug("No proxy configuration defined (global.proxy: ).")
            
    def __configure_proxy_settings(self, proxy_config: collections.OrderedDict):
        """Private method to configure all proxy specific setings, based on the configuration settings."""
        
        if "address" in proxy_config and (proxy_config['address'] is not None) and len(proxy_config['address']) > 0:
            self.check_zap_result(
                result=self.get_zap.core.set_option_proxy_chain_name(string=str(proxy_config['address'])), 
                method_name="set_option_proxy_chain_name"
            )
        if "port" in proxy_config and (proxy_config['port'] is not None) and proxy_config['port'] > 0:
            self.check_zap_result(
                result=self.get_zap.core.set_option_proxy_chain_port(integer=str(proxy_config['port'])), 
                method_name="set_option_proxy_chain_port"
            )
        if "skipProxyAddresses" in proxy_config and (proxy_config['skipProxyAddresses'] is not None):
            logging.debug("Disabling all possible pre existing proxy excluded domains before adding new ones.")
            self.check_zap_result(
                result=self.get_zap.core.disable_all_proxy_chain_excluded_domains(),
                method_name="add_proxy_chain_excluded_domain"
            )
            for address in proxy_config["skipProxyAddresses"]:
                logging.debug("Excluding (skip) address '%s' from global proxy setting", address)
                self.check_zap_result(
                    result=self.get_zap.core.add_proxy_chain_excluded_domain(value=address, isregex=True, isenabled=True),
                    method_name="add_proxy_chain_excluded_domain"
                )

    def __configure_proxy_authentication(self, proxy_config: collections.OrderedDict):
        """Private method to configure the proxy authenication, based on the configuration settings."""
        
        # Configure ZAP outgoing proxy server authentication
        if "authentication" in proxy_config and (proxy_config['authentication'] is not None):
            proxy_authentication_config = proxy_config['authentication']
            
            if "enabled" in proxy_authentication_config and proxy_authentication_config["enabled"]:
                self.check_zap_result(
                    result=self.get_zap.core.set_option_use_proxy_chain_auth(boolean=str(proxy_authentication_config["enabled"]).lower()),
                    method_name="set_option_use_proxy_chain_auth"
                )
                self.__configure_proxy_authentication_settings(proxy_authentication_config)
            else:
                logging.debug("Proxy Authentication configuration is not enabled (global.proxy.authentication.enabled: true)")
        else:
            logging.debug("No authentication configuration defined for proxy (global.proxy.authentication: ).")

    def __configure_proxy_authentication_settings(self, proxy_authentication_config: collections.OrderedDict):
        """Private method to configure the proxy authenication specific settings, based on the configuration settings."""
        
        if "username" in proxy_authentication_config and (proxy_authentication_config['username'] is not None) and len(proxy_authentication_config['username']) > 0:
            self.check_zap_result(
                result=self.get_zap.core.set_option_proxy_chain_user_name(string=str(proxy_authentication_config['username'])), 
                method_name="set_option_proxy_chain_user_name"
            )
        if "password" in proxy_authentication_config and (proxy_authentication_config['password'] is not None) and len(proxy_authentication_config['password']) > 0:
            self.check_zap_result(
                result=self.get_zap.core.set_option_proxy_chain_password(string=str(proxy_authentication_config['password'])), 
                method_name="set_option_proxy_chain_password"
            )
        if "realm" in proxy_authentication_config and (proxy_authentication_config['realm'] is not None) and len(proxy_authentication_config['realm']) > 0:
            self.check_zap_result(
                result=self.get_zap.core.set_option_proxy_chain_realm(string=str(proxy_authentication_config['realm'])), 
                method_name="set_option_proxy_chain_realm"
            )

    def __configure_socks(self, proxy_config: collections.OrderedDict):
        """Private method to configure the proxy socks settings, based on the configuration settings."""
        
        # Configure ZAP outgoing proxy server authentication
        if "socks" in proxy_config and (proxy_config['socks'] is not None):
            socks_config = proxy_config['socks']
            
            if "enabled" in socks_config and socks_config["enabled"]:
                self.check_zap_result(
                    result=self.get_zap.core.set_option_use_socks_proxy(boolean=str(socks_config["enabled"]).lower()),
                    method_name="set_option_use_socks_proxy"
                )
            else:
                logging.debug("Proxy Socks configuration is not enabled (global.proxy.socks.enabled: true)")   
        else:
            logging.debug("No proxy sock configuration found (global.proxy.socks: ).")

    def __configure_scripts(self):
        """Private method to configure the script settings, based on the configuration settings."""
        
        if "scripts" in self.get_global_config:
            self._log_all_scripts()
            for script in self.get_global_config["scripts"]:
                logging.debug("Configuring Script: '%s'", script["name"])
                self.__configure_load_script(script_config=script)
            self._log_all_scripts()
        else:
            logging.debug("No global scripts found to configure.")

    def __configure_load_script(self, script_config: collections.OrderedDict):
        """Protected method to load a new ZAP Script based on a given ZAP config.
        
        Parameters
        ----------
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
                self.check_zap_result(
                    result=self.get_zap.script.enable(scriptname=script_config["name"]),
                    method_name="script.enable"
                )
            else:
                self.check_zap_result(
                    result=self.get_zap.script.disable(scriptname=script_config["name"]),
                    method_name="script.disable"
                )
        else:
          logging.warning("Important script configs (scriptName, scriptType, scriptFilePath, scriptEngine) are missing! Ignoring the script configuration. Please check your YAML configuration.")