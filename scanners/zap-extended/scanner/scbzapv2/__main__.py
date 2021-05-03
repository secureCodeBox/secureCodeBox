import argparse
import json
import logging
import sys
import time

from pathlib import Path
from zapv2 import ZAPv2

from .zap_extended import ZapExtended
from .zap_configuration import ZapConfiguration

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getlogging('zap-scb-extended')

def main():
    args = get_parser_args()

    if args.target == None or len(args.target) <= 0:
        logging.info('Argument error: No target specified!')
        sys.exit(1)

    process(args)

    # logging.info('Write findings to file...')
    # write_findings_to_file(args.output_folder, findings)
    logging.info('Finished :-) !')


def process(args):

    api_key = None
    if not args.api_key == None and len(args.api_key) > 0:
        api_key = 'eor898q1luuq8054e0e5r9s3jh'    

    # MANDATORY. Define the listening address of ZAP instance
    zap_proxy = {
        "http": "http://127.0.0.1:8080",
        "https": "http://127.0.0.1:8080"
    }
    if not args.zap_url == None and len(args.zap_url) > 0:
        zap_proxy = {
            "http": "http://" + args.zap_url,
            "https": "http://" + args.zap_url
        }
    
    logging.info(':: Configuring ZAP Instance with %s', zap_proxy)
    # Connect ZAP API client to the listening address of ZAP instance
    zap = ZAPv2(proxies=zap_proxy, apikey=api_key)

    try:
        # wait at least 3 minutes for ZAP to start
        __wait_for_zap_start(zap, 3 * 60)

        __zap_tune(zap)

        __zap_access_target(zap, args.target)

        logging.info(':: Starting SCB ZAP Automation Framework with config %s', args.config_folder)
        zap_extended = ZapExtended(zap=zap, config_dir=args.config_folder)
        
        logging.info(':: Starting SCB ZAP Scan with target %s', args.target)
        zap_extended.scb_scan(target=args.target)

        alerts = zap_extended.get_zap_scan().get_alerts(args.target, [], [])
        logging.info(':: Found ZAP Alerts: %s', str(len(alerts)))

        zap_extended.generate_report_file(file_path=args.output_folder, report_type=args.report_type)

        __zap_shutdown(zap)
        logging.info(':: Finished !')

    except argparse.ArgumentError as e:
        logging.exception(f'Argument error: {e}')
        sys.exit(1)
    except Exception as e:
        logging.exception(f'Unexpected error: {e}')
        __zap_shutdown(zap)
        sys.exit(3)

def get_parser_args(args=None):
    parser = argparse.ArgumentParser(prog='zap-scb-extended',
                                     description='OWASP ZAP Scan extended with secureCodeBox ZAP Extended Automation Framework')
    parser.add_argument("-z",
                        "--zap-url",
                        help='The ZAP API Url used to call the ZAP API',
                        default=None,
                        required=True),
    parser.add_argument("-a",
                        "--api-key",
                        help='The ZAP API Key used to call the ZAP API',
                        default=None,
                        required=False),
    parser.add_argument("-c",
                        "--config-folder",
                        help='The path to a local folder containing the additional ZAP configuration YAMLs used to configure OWASP ZAP.',
                        default='/home/securecodebox/configs/',
                        required=False)
    parser.add_argument("-t",
                        "--target",
                        help="The target to scan with OWASP ZAP.",
                        default=None,
                        required=True),
    parser.add_argument("-o",
                        "--output-folder",
                        help='The path to a local folder used to store the output files, eg. the ZAP Report or logfiles.',
                        default='./',
                        required=False)
    parser.add_argument("-r",
                        "--report-type",
                        help='The OWASP ZAP Report Type u.',
                        choices=['XML', 'JSON', 'HTML', 'MD'],
                        default=None,
                        required=False),
    parser.add_argument("-s",
                        "--scan",
                        help='The scan config is optionaly used to configure what type of scan ZAP is forced to. Normaly this shold be configured with the config YAML.',
                        choices=['baseline', 'full', 'openApi', 'graphQl'],
                        default='baseline',
                        required=False)
    return parser.parse_args(args)

def __wait_for_zap_start(zap: ZAPv2, timeout_in_secs = 600):
    version = None
    if not timeout_in_secs:
        # if ZAP doesn't start in 10 mins then its probably not going to start
        timeout_in_secs = 600

    for x in range(0, timeout_in_secs):
        try:
            version = zap.core.version
            logging.debug('ZAP Version ' + version)
            logging.debug('Took ' + str(x) + ' seconds')
            break
        except IOError:
            time.sleep(1)

    if not version:
        raise IOError(
          errno.EIO,
          'Failed to connect to ZAP after {0} seconds'.format(timeout_in_secs))

def __zap_access_target(zap: ZAPv2, target):
    res = zap.urlopen(target)
    if res.startswith("ZAP Error"):
        raise IOError(errno.EIO, 'ZAP failed to access: {0}'.format(target))


def __zap_tune(zap: ZAPv2):
    logging.debug('Tune')
    logging.debug('Disable all tags')
    zap.pscan.disable_all_tags()
    logging.debug('Set max pscan alerts')
    zap.pscan.set_max_alerts_per_rule(10)

def __zap_shutdown(zap: ZAPv2):
        """ This shutdown ZAP and prints out ZAP Scanning stats before shutting down.
        """
        logging.info(":: Shutting down the running ZAP Instance.")
        zap.core.shutdown()

if __name__ == '__main__':
    main()
