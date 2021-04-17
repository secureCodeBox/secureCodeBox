"""
scbzapv2
A Python package containing secureCodeBox specific ZAPv2 Client extensions.
"""

__all__ = ['zap_configuration', 'zap_extended']
#__version__ = 0.1.0

from .zap_configuration import ZapConfiguration
from .zap_context import ZapConfigureContext
