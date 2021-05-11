import collections
import logging

from abc import ABC, abstractmethod
from zapv2 import ZAPv2, spider

from .zap_configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('ZapConfigureSpider')

class ZapConfigureSpider(ABC):
    """This abstract class configures a ZAP Spider in a running ZAP instance, based on a ZAP Configuration.
    
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

        self.__spider_config = None
        self.__spider_id = -1
        self.__ajax = False
    
    @property
    def get_config(self) -> str:
        """ Returns the complete config of the currently running ZAP instance."""
        return self.__config

    @property
    def get_zap(self) -> ZAPv2:
        """ Returns the spider id of the currently running ZAP instance."""
        return self.__zap

    @property
    def get_spider_id(self) -> int:
        """ Returns the spider id of the currently running ZAP instance."""
        return self.__spider_id

    @property
    def get_spider_config(self) -> str:
        """ Returns the spider config of the currently running ZAP instance."""
        return self.__spider_config
    
    def has_spider_id(self) -> bool:
        """ Returns a spider is currently running in the ZAP instance."""
        return self.__spider_id > 0
    
    def is_ajax_spider_enabled(self) -> bool:
        # "Context" is an optional config for spider
        if(not self.__spider_config == None and "ajax" in self.__spider_config and self.__spider_config["ajax"] == true):
            self.__ajax = bool(spider_config['ajax'])
        
        return self.__ajax

    def start_spider_by_url(self, url: str):
        """ Starts a ZAP Spider for the given url, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        url: str
            The url to spider.
        """

        if self.__config.has_spiders_configurations:
            context=self.__config.get_context_by_url(url)

            if not context == None and "name" in context:
                self.__spider_config = self.__config.get_spider_by_context_name(str(context["name"]))
                self.__ajax = True if "ajax" in self.__spider_config and self.__spider_config["ajax"] == "true" else False
            else:
                logging.warning("No context configuration found for target: %s! Starting spider without any related context.", url)

            logging.info("Trying to start Spider (Ajax: %s) with target url: '%s'", str(self.__ajax), url)
            self.__spider_id = self._start_spider(url=url, spider_config=self.__spider_config)
        else:
            logging.error("There is no spider specific configuration found.")

    def start_spider_by_index(self, index: int):
        """ Starts a ZAP Spider with the given index for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The index of the spider object in the list of spider configuration.
        """

        if self.__config.has_spiders_configurations:
            self.__spider_config = self.__config.get_spider_by_index(index)
            self.__ajax = True if "ajax" in self.__spider_config and self.__spider_config["ajax"] == "true" else False
            url = self.__spider_config["url"] if "url" in self.__spider_config else None

            logging.debug('Trying to start Spider (Ajax: %s) by configuration index %s', str(self.__ajax), str(index))
            self.__spider_id = self._start_spider(spider_config=self.__spider_config)

    def start_spider_by_name(self, name: str) -> int:
        """ Starts a ZAP Spider with the given name for the spiders configuration, based on the given configuration and ZAP instance.
        
        Parameters
        ----------
        index: int
            The name of the spider object in the list of spider configuration.
        """

        if self.__config.has_spiders_configurations:
            self.__spider_config = self.__config.get_spider_by_name(name)
            self.__ajax = True if "ajax" in self.__spider_config and self.__spider_config["ajax"] == "true" else False
            url = self.__spider_config["url"] if "url" in self.__spider_config else None
            
            logging.debug('Trying to start Spider (Ajax: %s) by configuration index %s', str(self.__ajax), str(index))
            self.__spider_id = self._start_spider(url=url, spider_config=self.__spider_config)
    
    @abstractmethod
    def configure_spider(self, zap_spider: spider, spider_config: collections.OrderedDict):
        """ Configures a ZAP HTTP Spider with the given spider configuration, based on the running ZAP instance.
        
        Parameters
        ----------
        zap_spider: spider
            The reference to the running ZAP spider to configure.
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        raise NotImplementedError

    @abstractmethod
    def _start_spider(self, url: str, spider_config: collections.OrderedDict):
        """ Starts a ZAP Spider with the given spiders configuration, based on the internal referenced ZAP instance.
        
        Parameters
        ----------
        spider_config: collections.OrderedDict
            The spider configuration based on ZapConfiguration.
        """
        raise NotImplementedError
    
    def _check_zap_spider_id_result(self, method: str):
        """ Checks the given spiderId for ZAP Errors and logs wariing messages if there are errors returened by ZAP.
        
        Parameters
        ----------
        spiderId: str
            The spiderId of a ZAP Call.
        method: str
            The name of the method used (to call ZAP).
        """
        
        if "OK" != self.__spider_id:
            logging.warning("Failed to configure Spider ['%s'], result is: '%s'", method, self.__spider_id)
        else:
            logging.debug("Successfull configured Spider ['%s'], result is: '%s'", method, self.__spider_id)
    
    @abstractmethod
    def wait_until_spider_finished(self):
        """ Wait until the running ZAP Spider finished and log results."""
        raise NotImplementedError