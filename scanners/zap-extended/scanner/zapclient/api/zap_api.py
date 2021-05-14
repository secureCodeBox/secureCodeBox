#!/usr/bin/env python
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
    level=logging.DEBUG,
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
        if self.get_config.has_api_configurations():
            logging.debug('Configure #%s APIs(s) with: %s', len(self.get_config.get_api_configurations()), self.get_config.get_api_configurations())
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

        if self.get_config.has_api_configurations:
            api_context=self.get_config.get_context_by_url(url)
            self.__api_config = self.get_config.get_api_configurations_by_context_name(str(api_context["name"]))

            logging.info("Trying to start API Import with target url: '%s'", url)
            self.__load_api(url=url, api_config=self.__api_config)
        else:
            logging.error("There is no API specific configuration section defined in your configuration YAML.")

    def start_api_by_index(self, index: int):
        """ Starts a ZAP Api scan with the given index for the Apis configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The index of the Api object in the list of Api configuration.
        """
        if self.get_config.has_api_configurations:
            logging.debug('Trying to start API Import by configuration index: %s', str(index))
            self.__load_api(api_config=self.get_config.get_api_by_index(index))

    def start_api_by_name(self, name: str):
        """ Starts a ZAP Api scan with the given name for the Apis configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The name of the Api object in the list of Api configuration.
        """

        if self.get_config.has_api_configurations:
            logging.debug('Trying to start API Import by name: %s', str(name))
            self.__load_api(api_config=self.get_config.get_api_by_name(name))

    def __load_api(self, url: str, api_config: collections.OrderedDict):
        
        if (api_config is not None) and "format" in api_config and api_config["format"] == 'openapi' and "url" in api_config:
            logging.debug('Import Api URL ' + api_config["url"])
            result = self.get_zap.openapi.import_url(api_config["url"], api_config["hostOverride"])
            urls = self.get_zap.core.urls()
            
            logging.info('Number of Imported URLs: ' + str(len(urls)))
            logging.debug('Import warnings: ' + str(result))
        else:
            logging.info("No complete API definition configured (format: openapi, url: xxx): %s!", api_config)

    def __obtain_and_store_api_spec(self, target: str, Api_config: collections.OrderedDict):
        """ This function downloads the Api JSON spec file and saves it into the ZAP container volume.
        
        Parameters
        ----------
        target: str
            The name of the Api object in the list of Api configuration.
        """

        url = Api_config['url'] if 'url' in Api_config else None
        configMap = Api_config['configMap'] if 'configMap' in Api_config else None
        spec = Api_config['spec'] if 'spec' in Api_config else None

        open_api_json = None

        if configMap != None or spec != None:
            logging.info('Reading Api spec from configMap / helm values...')
            raw_api_spec = None
            filename = "/zap/wrk/Api/Api.json" if spec != None else "/zap/wrk/Api/" + configMap['key']

            with open(filename, 'r') as confFile:
                raw_api_spec=confFile.read()

                open_api_json = self.__fix_open_api_spec(raw_api_spec)
                # This is the location where -t option points to:
                local_file = '/zap/wrk/' + target
                self.__save_json_in_volume(local_file, open_api_json)
        else:
            logging.error("No proper way to fetch the Api Spec was configured")

    def __request_spec_json_basic_auth(self, url, username, password):
        logging.info('Requesting Api (BasicAuth) definition from: %s', url)
        response = requests.get(url, auth=(username, password))
        logging.debug('Response code is: %s', str(response.status_code))
        
        if 200 != response.status_code:
            logging.error("downloading '%s' failed!", url)
            raise RuntimeError("downloading '%s' failed!", url) 

    def __fix_open_api_spec(self, jsonString, url: str):
        # If we do not set this ZAP fails with an excpetion because it does not know
        # where to start scanning.
        
        try:
            # Update url in servers field
            ApiSpec = json.loads(jsonString)

            # swagger 2.0 requires a server definition split into host, basePath and schemas
            if 'swagger' in ApiSpec and ApiSpec['swagger'] == "2.0":
                logging.debug('Skipping server replacement as the spec is Api v2')
                baseUrl = urlparse(url)

                ApiSpec["host"] = baseUrl.netloc
                ApiSpec["basePath"] = baseUrl.path
                ApiSpec["schemes"] = [ baseUrl.scheme ]

            # Api v3 uses a "servers" field to specify the baseUrl
            else:
                ApiSpec['servers'] = [{ 
                    "url": url,
                    "description": "secureCodeBox target"
                }]
            jsonString = json.dumps(ApiSpec)
        except:
            logging.warning("Failed to replace server address, scan might fail because of a invalid address")

        return jsonString

    def __save_json_in_volume(self, file_name, content):
        logging.debug('Saving content to ' + file_name)
        f = open(file_name, 'w')
        f.write(content)
        f.close()
