<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

# ZAP Scanner

This directory contains a secureCodeBox specific python implementation of an ZAP Client.

## Testing
If you want to test the ZAP Client localy you can use

```bash
# test everything combined
make test
# start only unit tests
make unit-test
# start only docker base tests
make docker-test
# start only local zap based tests
make local-test
```

### Local testing with an already running ZAP instance (at localhost)
If you want to run the local test directly based on pytest you can do so.
Please configure `test_integration_zap_local.py` before running with your ZAP _host_ and _port_ address:

```bash
pytest ./tests/test_integration_zap_local.py --log-cli-level "DEBUG"
```

### Docker based testing
If you want to run the local test directly based on pytest you can do so.

```bash
pytest ./tests/test_integration_docker_local.py  --log-cli-level "DEBUG"
```

## Additional reading and sources
* https://realpython.com/documenting-python-code/
* https://docs.python.org/3/howto/logging-cookbook.html#logging-cookbook
* https://pypi.org/project/HiYaPyCo/
* https://github.com/zaproxy/zap-api-python/blob/master/src/examples/zap_example_api_script.py
* Python Package Structure:
  * https://docs.pytest.org/en/stable/goodpractices.html
  * https://blog.ionelmc.ro/2014/05/25/python-packaging/#the-structure
