# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

"""
zapclient
A Python package containing secureCodeBox specific ZAPv2 Client extensions to automate ZAP scans..
"""

__all__ = ['zap_scanner', 'zap_scanner_active']

from .zap_abstract_scanner import ZapConfigureScanner
from .zap_scanner_active import ZapConfigureActiveScanner
