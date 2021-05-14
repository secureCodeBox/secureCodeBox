"""
zapclient
A Python package containing secureCodeBox specific ZAPv2 Client extensions to automate ZAP.
"""

__all__ = ['zap_configuration', 'zap_abstract_client']

from .zap_configuration import ZapConfiguration
from .zap_abstract_client import ZapClient