#
# This file contains some ZAP hooks.
#
# See https://www.zaproxy.org/docs/docker/scan-hooks/ for more information.
#

import collections
import logging
import glob
import hiyapyco

class ZapConfiguration():
    """This class represent a ZAP specific configuration based on a given YAML file"""
    
    def __init__(self, scantype_config_dir: str, scan_config_dir: str):
        """Initial constructor used for this class"""
        
        self.__scantype_config_dir = scantype_config_dir
        self.__scantype_config_dir_glob = scantype_config_dir + "*.yaml"
        self.__scan_config_dir = scan_config_dir
        self.__scan_config_dir_glob = scan_config_dir + "*.yaml"
        
        self.__config = None
        self.__readConfigFiles()

    def __readConfigFiles(self):
        """Private method to read all existing config YAML files an create a new ZAP Configuration object"""

        if(self.__scantype_config_dir):
            logging.info("ScanType YAML config dir: '%s'", self.__scantype_config_dir)
            scantype_config_files = glob.glob(self.__scantype_config_dir_glob)
        else:
            logging.warning("ScanType YAML config dir not found!")
            scantype_config_files = []
        
        if(self.__scan_config_dir):
            logging.info("Scan YAML config dir: '%s'", self.__scan_config_dir)
            scan_config_files = glob.glob(self.__scan_config_dir_glob)
        else:
            logging.warning("Scan YAML config dir not found!")
            scan_config_files = []
            
        logging.info("Importing YAML files with ScanType ZAP configuration with: '%s'", scantype_config_files)
        logging.info("Importing YAML files with Scan ZAP configuration with: '%s'", scan_config_files)
        if ((len(scantype_config_files) > 0) or (len(scan_config_files) > 0)):
            self.__config = hiyapyco.load(*scantype_config_files, *scan_config_files, method=hiyapyco.METHOD_MERGE, interpolate=True, mergelists=True, failonmissingfiles=False)
            logging.info("Finished importing YAML: %s", self.__config)
        else:
            logging.warning("No YAML configuration files fond :-/")

    def get_config(self) -> collections.OrderedDict:
        """Returns the ZAP configuration object"""

        return self.__config
    
    def get_zap_contexts(self) -> list:
        """Returns a list with all ZAP context configuration objects"""

        return self.__config["contexts"]
    
    def get_zap_context(self, id) -> list:
        """Returns the ZAP context configuration object with the given id."""

        return self.__config["contexts"][id]
    
    def __str__(self):
        return " ZapConfiguration( " + self.get_config() + " )"
