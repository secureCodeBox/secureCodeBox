#!/usr/bin/env python

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# -*- coding: utf-8 -*-

import collections


class ZapConfigurationContextUsers:
    """Helper class to grab user related configs from a context"""

    @staticmethod
    def get_context_user_by_name(context: collections.OrderedDict, name: str) -> collections.OrderedDict:
        """Returns the ZAP Context Users configuration object with the given name.

        Parameters
        ----------
        context: collections.OrderedDict
            The ZAP context configuration object to return the user for.
        name: str
            The name of the context to return from the list of contexts.
        """
        users = context["users"] if "users" in context else []
        return next((user for user in users if user['name'] == name), None)
