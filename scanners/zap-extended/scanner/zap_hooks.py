#
# This file contains some ZAP hooks.
#
# See https://www.zaproxy.org/docs/docker/scan-hooks/ for more information.
#

import os
import sys
import logging
import time

from zapv2 import ZAPv2
from zapclient import ZapConfiguration
from zapclient import ZapConfigureContext
from zapclient import ZapConfigureSpider
from zapclient import ZapConfigureActiveScanner

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M',
    filename='zap-extended.log',
    filemode='w')

config = ZapConfiguration("/zap/secureCodeBox-extensions/configs/")


def cli_opts(opts):
    logging.info('-> Hook cli_opts() startet (opts: ' + str(opts) + ') ...')

    logging.info('-> Hook cli_opts() finished...')
    return opts


def zap_started(zap, target):
    """This is a hook function called by the ZAP Python wrapper zap-api-scan.py
       
       This hook is executed in the early stage after the ZAP started successfully.
    """
    logging.info('-> Hook zap_started started (target: %s) ...', str(target))

    # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
    if config and config.has_context_configurations:
        # Starting to configure the ZAP Instance based on the given Configuration
        ZapConfigureContext(zap, config)
    else:
        logging.warning(
            "No valid ZAP configuration object found: %s! It seems there is something important missing.",
            config)

    logging.info('-> Hook zap_started() finished...')

    return zap, target


def zap_spider(zap, target):
    """This is a hook function called by the ZAP Python wrapper zap-api-scan.py
       
       This hook is executed in the early stage after the ZAP started successfully.
    """
    logging.info('-> Hook zap_spider started (target: %s) ...', str(target))

    # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
    if config and config.has_spider_configurations:
        # Starting to configure the ZAP Instance based on the given Configuration
        zap_spider = ZapConfigureSpider(zap, config)
        spider_id = zap_spider.start_spider_by_url(target)
        zap_spider.wait_until_http_spider_finished(spider_id)

    logging.info('-> Hook zap_spider() finished...')

    return zap, target

def zap_ajax_spider(zap, target, max_time):
    """This is a hook function called by the ZAP Python wrapper zap-api-scan.py
       
       This hook is executed in the early stage after the ZAP started successfully.
    """
    logging.info('-> Hook zap_ajax_spider started (target: %s) ...',
                 str(target))

    # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
    if config and config.has_spider_configurations:
        # Starting to configure the ZAP Instance based on the given Configuration
        zap_spider = ZapConfigureSpider(zap, config)
        # Search for the corresponding context based on the given targetUrl which should correspond to defined the spider url
        spider_id = zap_spider.start_spider_by_url(target)
        zap_spider.wait_until_ajax_spider_finished(spider_id)

    logging.info('-> Hook zap_ajax_spider() finished...')

    return zap, target

def zap_active_scan(zap, target, policy):
    """This is a hook function called by the ZAP Python wrapper zap-api-scan.py
       
       This hook is executed in the early stage after the ZAP started successfully.
    """
    logging.info('-> Hook zap_active_scan started (target: %s) ...',
                 str(target))

    # if a ZAP Configuration is defined start to configure the running ZAP instance (`zap`)
    if config and config.has_scan_configurations:
        # Starting to configure the ZAP Instance based on the given Configuration
        zap_scan = ZapConfigureActiveScanner(zap, config)
        # Search for the corresponding context based on the given targetUrl which should correspond to defined the spider url
        scan_id = zap_scan.start_scan_by_url(target)
        zap_scan.wait_until_finished(scan_id)

    logging.info('-> Hook zap_active_scan() finished...')

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


def __find_env_var(name: str) -> str:
    if name not in os.environ:
        logging.warning("ENV var %s not set!", name)
        sys.exit(1)

    value = os.environ[name]

    if not value:
        logging.warning("Value of ENV var %s is empty!", name)
        sys.exit(1)

    return value


def __get_config(config_dir_env: str):
    config = None

    config_dir = __find_env_var(config_dir_env)
    logging.info("Searching for ScanType YAML configs at: '%s'",
                 config_dir_env)

    if ((config_dir and len(config_dir) > 0)):
        logging.info("ZapConfiguration('%s')", config_dir)
        config = ZapConfiguration(config_dir)
    else:
        logging.info(
            "ZapConfiguration('/zap/secureCodeBox-extensions/configs/')")
        config = ZapConfiguration("/zap/secureCodeBox-extensions/configs")

    return config
