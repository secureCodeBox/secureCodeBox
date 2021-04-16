import collections
import logging
import glob
import hiyapyco

class ZapConfiguration():
    """This class represent a ZAP specific configuration based on a given YAML file"""
    
    def __init__(self, config_dir: str):
        """Initial constructor used for this class"""
        
        self.config_dir = config_dir
        self.config_dir_glob = config_dir + "*.yaml"
        
        self.__config = []
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

    def get_config(self) -> collections.OrderedDict:
        """Returns the ZAP configuration object"""

        return self.__config
    
    def get_zap_contexts(self) -> list:
        """Returns a list with all ZAP context configuration objects"""
        result = []

        if len(self.__config) > 0 and "contexts" in self.__config:
            result = self.__config["contexts"]

        return result
    
    def get_zap_context(self, id) -> list:
        """Returns the ZAP context configuration object with the given id."""

        return self.get_zap_contexts().get(id)
    
    def __str__(self):
        return " ZapConfiguration( " + str(self.get_config()) + " )"
