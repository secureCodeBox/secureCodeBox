#!/usr/bin/env python
# -*- coding: utf-8 -*-

from mock.mock import patch
import pytest

import mock
from unittest import TestCase

from zapv2 import ZAPv2

from zapclient.zap_configuration import ZapConfiguration
from zapclient.context.zap_context import ZapConfigureContext

class ZapScannerTests(TestCase):

    @pytest.mark.unit
    def test_context_empty(self):
        pass

        # # build our dependencies
        # mock_zap = mock.create_autospec(ZAPv2.context.context_list)
        # mock_config = mock.create_autospec(ZapConfiguration)

        # testobject = ZapConfigureContext(mock_zap, mock_config)
        # testobject.configure_contexts()

