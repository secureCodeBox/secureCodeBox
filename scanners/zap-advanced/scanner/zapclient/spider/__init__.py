# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

"""
zapclient
A Python package containing secureCodeBox specific ZAPv2 Client extensions to automate ZAP spider.
"""

__all__ = ["zap_abstract_spider", "zap_spider_http", "zap_spider_ajax"]

from .zap_abstract_spider import ZapConfigureSpider
from .zap_spider_ajax import ZapConfigureSpiderAjax
from .zap_spider_http import ZapConfigureSpiderHttp
