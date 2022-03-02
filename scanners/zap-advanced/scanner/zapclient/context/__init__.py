# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

"""
context
A Python package containing secureCodeBox specific ZAPv2 Client extensions to configure ZAP API contexts.
"""

__all__ = ['zap_context', 'zap_context_authentication']

from .zap_context import ZapConfigureContext
from .zap_context_authentication import ZapConfigureContextAuthentication