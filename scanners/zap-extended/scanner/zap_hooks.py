#
# This file contains some ZAP hooks.
#
# See https://www.zaproxy.org/docs/docker/scan-hooks/ for more information.
#

import os
import sys
import logging
import zap_extended
import zap_configuration
from zapv2 import ZAPv2

# set up logging to file - see previous section for more details
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
                    datefmt='%Y-%m-%d %H:%M',
                    filename='zap-extended.log',
                    filemode='w')

#config = zap_configuration.ZapConfiguration("/zap/secureCodeBox-extensions/configs/")

# def override_from_env_vars(d, prefix=""):
#     """Overwrite config values, when a equivalent env var is defined.

#        E.g. config['openApi']['url] will return the value for OPENAPI_URL, if defined. Otherwise the existing value from json config will be used.
#     """
#     for k, v in d.items():
#         if isinstance(v, dict):
#             override_from_env_vars(v, prefix + k + "_")
#         else:
#             env_var_name = (prefix + k).upper()
#             if env_var_name in os.environ:
#                 print("'" + env_var_name + "' defined as Env Var. Will override value from config.json")
#                 d[k] = os.environ[env_var_name]

# override_from_env_vars(config)

def cli_opts(opts):
    logging.info('Hook cli_opts() startet (opts: ' + str(opts) + ') ...')

    logging.info('Hook cli_opts() finished...')
    return opts

def zap_started(zap, target):
    """This is a hook function called by the ZAP Python wrapper zap-api-scan.py
       
       This hook is executed in the early stage after the ZAP started successfully.
    """
    logging.info('Hook zap_started started (target: '+ str(target) +') ...')

    config = get_config('SCB_ZAP_SCANTYPE_CONFIG_DIR', 'SCB_ZAP_SCAN_CONFIG_DIR') 

    if config:
        # Starting to configure the ZAP Instance based on the given Configuration
        scb_zap = zap_extended.ZapExtended(zap, [])
        scb_zap.configure_context(zap, config.get_zap_contexts())
    else:
        logging.warning("No valid ZAP configuration object found: %s! It seems there is something important missing.", config)

    logging.info('Hook zap_started() finished...')

    return zap, target

def zap_pre_shutdown(zap: ZAPv2):
    """This is a hook function called by the ZAP Python wrapper zap-api-scan.py
       
       This hook prints out ZAP Scanning stats before shutting down.
    """
    stats = zap.stats.all_sites_stats()
    print(stats)

#
# Helper functions
# -------------------------------------

def find_target_option(opts) -> str:
    target = ''
    for opt, arg in opts:
        if opt == '-t':
            return arg

def find_env_var(name: str) -> str:
    if name not in os.environ:
        logging.warning("ENV var %s not set!", name)
        sys.exit(1)

    value = os.environ[name]

    if not value:
        logging.warning("Value of ENV var %s is empty!", name)
        sys.exit(1)

    return value

def get_config(config_scantype_dir_env: str, config_scan_dir_env: str):
    config = None

    scantype_config_dir = find_env_var(config_scantype_dir_env)
    logging.info("Searching for ScanType YAML configs at: '%s'", config_scantype_dir_env)

    scan_config_dir = find_env_var(config_scan_dir_env)
    logging.info("Searching for Scan YAML configs at: '%s'", config_scan_dir_env)
    
    if ((scan_config_dir and len(scan_config_dir) > 0) or (scantype_config_dir and len(scantype_config_dir) > 0)):
        logging.info("ZapConfiguration('%s', '%s')", scantype_config_dir, scan_config_dir)
        config = zap_configuration.ZapConfiguration(scantype_config_dir, scan_config_dir)
    else:
        logging.info("ZapConfiguration('/zap/secureCodeBox-extensions/configs/')")
        config = zap_configuration.ZapConfiguration("/zap/secureCodeBox-extensions/configs/scantype", "/zap/secureCodeBox-extensions/configs/scan")

    return config
