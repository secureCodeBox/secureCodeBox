// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

var HttpRequestHeader = Java.type("org.parosproxy.paros.network.HttpRequestHeader"),
    HttpHeader = Java.type("org.parosproxy.paros.network.HttpHeader"),
    URI = Java.type("org.apache.commons.httpclient.URI");
/**
 * OIDC Password Grant Type based authentication script for ZAP.
 *
 * This authenticate function is called whenever ZAP requires to authenticate,
 * for a Context which has this script selected as the authentication method.
 *
 * This function should send any messages that are required to do the authentication
 * and should return a message with an authenticated response.
 *
 * This auth is based on the grand type "password" to retrieve fresh tokens:
 * https://developer.okta.com/blog/2018/06/29/what-is-the-oauth2-password-grant
 *
 * For Authentication select/configure in your ZAP Context:
 *
 * - Authentication method: ScriptBased Authentication
 * - Login FORM target URL: https://$keycloak-url/auth/realms/$app/protocol/openid-connect/token
 * - username parameter: your-username-to-get-tokens
 * - password parameter: your-password-to-get-tokens
 * - Logged out regex: ".*Credentials are required to access this resource.*"
 *
 * NOTE: Any message sent in the function should be obtained using the 'helper.prepareMessage()'
 *       method.
 *
 * @param {Object} helper - Helper class providing useful methods: prepareMessage(), sendAndReceive(msg).
 * @param {Object} paramsValues - Values of the parameters configured in the Session Properties -> Authentication panel.
 *                                The paramsValues is a map with parameters names as keys (like returned
 *                                by the getRequiredParamsNames() and getOptionalParamsNames() functions below).
 * @param {Object} credentials - Object containing the credentials configured in the Session Properties -> Users panel.
 *                               The credential values can be obtained via calls to the getParam(paramName) method.
 *                               The param names are the ones returned by the getCredentialsParamsNames() below.
 */
function authenticate(helper, paramsValues, credentials) {
    print("Authentication via scb-oidc-password-grand-type.js...");

    // Prepare the login request details
    var url = paramsValues.get("URL");
    var clientId = paramsValues.get("clientId");
    print("Logging in to url: " + url + " clientId: " + clientId);

    var requestUri = new URI(url, false);
    var requestMethod = HttpRequestHeader.POST;

    // Build the request body using the credentials values
    // This auth is based on the grand type "password" to retrieve fresh tokens
    // https://developer.okta.com/blog/2018/06/29/what-is-the-oauth2-password-grant
    var requestBody = "grant_type=password&client_id=" + clientId + "&username=" + credentials.getParam("username") + "&password=" + credentials.getParam("password");

    // Build the actual message to be sent
    print("Sending " + requestMethod + " request to " + requestUri + " with body: " + requestBody);
    var msg = helper.prepareMessage();
    msg.setRequestBody(requestBody);

    var requestHeader = new HttpRequestHeader(requestMethod, requestUri, HttpHeader.HTTP10);
    msg.setRequestHeader(requestHeader);
    print("Msg prepared")

    // Send the authentication message and return it
    try {
        helper.sendAndReceive(msg);
        print("Received response status code for authentication request: " + msg.getResponseHeader().getStatusCode());
        return msg;
    } catch (err) {
        print("Got error");
        print(err);
    }

    return null
}

/**
 * This function is called during the script loading to obtain a list of required configuration parameter names.
 *
 * These names will be shown in the Session Properties -> Authentication panel for configuration. They can be used
 * to input dynamic data into the script, from the user interface (e.g. a login URL, name of POST parameters etc.).
 */
function getRequiredParamsNames() {
    return ["URL", "clientId"];
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

/**
 * This function is called during the script loading to obtain a list of required credential parameter names.
 *
 * They are configured for each user corresponding to an authentication using this script.
 */
function getCredentialsParamsNames() {
    return ["username", "password"];
}