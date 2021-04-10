# ZAP Hooks

This directory contains Python [hook scripts](https://www.zaproxy.org/docs/docker/scan-hooks/)
for the Zap Python wrapper used by the ZAP Docker image.

These scripts are automatically executed, if placed into the `/wrk` volume mount.


## Testing

### Local testing with an already running ZAP instance
Please configure `test_zap_local.py` before running with your ZAP _host_ and _port_ address:
```bash
python3 test_zap_local.py --log=INFO
```

### Docker based testing
```bash
export PROJECT="/your/fullPath/to/this/folder/secureCodeBox/scanners/zap-extended"
./tests/docker/test.sh
```

## Additional reading and sources
* https://realpython.com/documenting-python-code/
* https://docs.python.org/3/howto/logging-cookbook.html#logging-cookbook
* https://pypi.org/project/HiYaPyCo/
* https://github.com/zaproxy/zap-api-python/blob/master/src/examples/zap_example_api_script.py
* Python Package Structure:
  * https://docs.pytest.org/en/stable/goodpractices.html
  * https://blog.ionelmc.ro/2014/05/25/python-packaging/#the-structure
