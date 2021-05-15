import argparse
import logging
import sys

from zapv2 import ZAPv2

from .zap_automation import ZapAutomation

# set up logging to file - see previous section for more details
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(name)-12s %(levelname)-8s: %(message)s',
    datefmt='%Y-%m-%d %H:%M')

logging = logging.getLogger('zapclient')

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

    logging.info(':: Starting SCB ZAP Automation Framework with config %s', args.config_folder)
    zap_automation = ZapAutomation(zap=zap, config_dir=args.config_folder)
    
    try:
        logging.info(':: Starting SCB ZAP Scan with target %s', args.target)
        zap_automation.scan_target(target=args.target)

        alerts = zap_automation.get_zap_scanner.get_alerts(args.target, [], [])
        logging.info(':: Found ZAP Alerts: %s', str(len(alerts)))

        zap_automation.generate_report_file(file_path=args.output_folder, report_type=args.report_type)

        zap_automation.zap_shutdown()
        logging.info(':: Finished !')

    except argparse.ArgumentError as e:
        logging.exception(f'Argument error: {e}')
        sys.exit(1)
    except Exception as e:
        logging.exception(f'Unexpected error: {e}')
        zap_automation.zap_shutdown()
        sys.exit(3)

def get_parser_args(args=None):
    parser = argparse.ArgumentParser(prog='zap-client',
                                     description='OWASP secureCodeBox OWASP ZAP Client (can be used to automate OWASP ZAP instances based on YAML configuration files.)')
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
                        required=False)
    return parser.parse_args(args)

if __name__ == '__main__':
    main()
