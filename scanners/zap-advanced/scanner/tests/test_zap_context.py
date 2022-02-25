#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import pytest

from unittest.mock import MagicMock, Mock, patch
from unittest import TestCase

from zapv2 import ZAPv2

from zapclient.configuration import ZapConfiguration
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

