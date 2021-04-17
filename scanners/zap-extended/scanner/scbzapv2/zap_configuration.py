import collections
import logging
import glob
import hiyapyco

class ZapConfiguration():
    """This class represent a ZAP specific configuration based on a given YAML file"""
    
    def __init__(self, config_dir: str):
        """Initial constructor used for this class
        
        Parameters
        ----------
        config_dir : str
            The relative path to the config dir containing all relevant config YAML files.
        """
        
        self.config_dir = config_dir
        self.config_dir_glob = config_dir + "*.yaml"
        
        self.__config = collections.OrderedDict()
        self.__readConfigFiles()

    def __readConfigFiles(self):
        """Private method to read all existing config YAML files an create a new ZAP Configuration object"""

        if(self.config_dir):
            logging.debug("ZAP YAML config dir: '%s'", self.config_dir)
            config_files = glob.glob(self.config_dir_glob)
        else:
            logging.warning("YAML config dir not found! This is no problem but possibly not intendend here.")
            config_files = []
            
        logging.info("Importing YAML files for ZAP configuration at dir: '%s'", config_files)
        if (len(config_files) > 0):
            self.__config = hiyapyco.load(*config_files, method=hiyapyco.METHOD_MERGE, interpolate=True, mergelists=True, failonmissingfiles=False)
            logging.info("Finished importing YAML: %s", self.__config)
        else:
            logging.warning("No ZAP YAML Configuration files found :-/ This is no problem but possibly not intendend here.")

    def has_configurations(self) -> bool:
        """Returns true if any ZAP Configuration is defined, otherwise false."""
        
        result = False

        if self.__config and len(self.__config) > 0:
            result = True

        return result
    
    def get_config(self) -> collections.OrderedDict():
        """Returns the complete ZAP Configuration object"""

        return self.__config
    
    def has_context_configurations(self) -> bool:
        """Returns true if any ZAP Context is defined, otherwise false."""

        return (self.has_configurations() and "contexts" in self.get_config())
    
    def get_contexts(self) -> list:
        """Returns a list with all ZAP Context configuration objects"""
        result = collections.OrderedDict()

        if self.has_context_configurations:
            result = self.__config["contexts"]

        return result
    
    def get_context_by_index(self, index: int) -> collections.OrderedDict:
        """Returns the ZAP Context configuration object with the given index.
        
        Parameters
        ----------
        index: int
            The list index of the context to return from the list of contexts.
        """
        result = collections.OrderedDict()

        if self.has_context_configurations and len(self.get_contexts()) > index:
            result = self.get_contexts()[index]

        return result
    
    def get_context_by_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP Context configuration object with the given index.
        
        Parameters
        ----------
        name: str
            The name of the context to return from the list of contexts.
        """

        result = collections.OrderedDict()

        if self.has_context_configurations:
            result = next((context for context in self.get_contexts() if context['name'] == value), None)

        return result

    def has_scan_configurations(self) -> bool:
        """Returns true if any ZAP Scan is defined, otherwise false."""

        return (self.has_configurations() and "scans" in self.get_config())
    
    def get_scans(self) -> list:
        """Returns a list with all ZAP Scan configuration objects"""
        result = collections.OrderedDict()

        if self.has_scan_configurations:
            result = self.__config["scans"]

        return result
    
    def get_scan_by_index(self, index: int) -> collections.OrderedDict:
        """Returns the ZAP Scan configuration object with the given index.
        
        Parameters
        ----------
        index: int
            The list index of the scan to return from the list of scans.
        """
        result = collections.OrderedDict()

        if self.has_scan_configurations and len(self.get_scans()) > index:
            result = self.get_scans()[index]

        return result
    
    def get_scans_by_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP Scan configuration object with the given name.
        
        Parameters
        ----------
        name: str
            The name of the scan to return from the list of scans.
        """
        result = collections.OrderedDict()

        if self.has_scan_configurations:
            result = next((scan for scan in self.get_scans() if scan['name'] == value), None)

        return result

    def has_spider_configurations(self) -> bool:
        """Returns true if any ZAP Spider is defined, otherwise false."""

        return (self.has_configurations() and "spiders" in self.get_config())
    
    def get_spiders(self) -> list:
        """Returns a list with all ZAP Spider configuration objects"""
        result = collections.OrderedDict()

        if self.has_spider_configurations:
            result = self.__config["spiders"]

        return result
    
    def get_spider_by_index(self, index: int) -> collections.OrderedDict:
        """Returns the ZAP Spider configuration object with the given index.
        
        Parameters
        ----------
        index: int
            The list index of the spider to return from the list of spiders.
        """
        result = collections.OrderedDict()

        if self.has_spider_configurations and len(self.get_spiders()) > index:
            result = self.get_spiders()[index]

        return result
    
    def get_spider_by_name(self, name: str) -> collections.OrderedDict:
        """Returns the ZAP Spider configuration object with the given name.
        
        Parameters
        ----------
        name: str
            The name of the spider to return from the list of spiders.
        """
        result = collections.OrderedDict()

        if self.has_spider_configurations:
            result = next((spider for spider in self.get_spiders() if spider['name'] == value), None)

        return result

    def __str__(self):
        return " ZapConfiguration( " + str(self.get_config()) + " )"
