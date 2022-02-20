// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Session Management script for OIDC Authentication.
 *
 * Adapted from OWASP Juice Shop Example: https://www.zaproxy.org/blog/2020-06-04-zap-2-9-0-highlights/
 */

function extractWebSession(sessionWrapper) {
    print("extractWebSession")
    // parse the authentication response
    var json = JSON.parse(sessionWrapper.getHttpMessage().getResponseBody().toString());
    var token = json.access_token;
    // save the authentication token
    sessionWrapper.getSession().setValue("token", token);
}

function clearWebSessionIdentifiers(sessionWrapper) {
    print("clearWebSessionIdentifiers")
    var headers = sessionWrapper.getHttpMessage().getRequestHeader();
    headers.setHeader("Authorization", null);
}

function processMessageToMatchSession(sessionWrapper) {
    print("processMessageToMatchSession")
    var token = sessionWrapper.getSession().getValue("token");
    if (token === null) {
        print('JS mgmt script: no token');
        return;
    }

    // add the saved authentication token as an Authentication header and a cookie
    var msg = sessionWrapper.getHttpMessage();
    msg.getRequestHeader().setHeader("Authorization", "Bearer " + token);
}

/**
 * This function is called during the script loading to obtain a list of required configuration parameter names.
 *
 * These names will be shown in the Session Properties -> Authentication panel for configuration. They can be used
 * to input dynamic data into the script, from the user interface (e.g. a login URL, name of POST parameters etc.).
 */
function getRequiredParamsNames() {
    return [];
}

/**
 * This function is called during the script loading to obtain a list of optional configuration parameter names.
 *
 * These will be shown in the Session Properties -> Authentication panel for configuration. They can be used
 * to input dynamic data into the script, from the user interface (e.g. a login URL, name of POST parameters etc.).
 */
function getOptionalParamsNames() {
    return [];
}
