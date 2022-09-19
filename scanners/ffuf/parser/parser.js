// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {

  if (!fileContent || !fileContent.results || fileContent.results.length == 0) {
    return [];
  }
  return fileContent.results.map(result => {
    return {
      name: 'todo rn - what to put here??',
      description: `Content ${result.input?.FUZZ} was found on the webserver ${result.host}.`, // todo rn: what if no FUZZ keyword is used??
      osi_layer: 'APPLICATION',
      severity: 'LOW', // todo rn: how to determine if the finding contains a HIGH, e.g. Spring Actuator endpoints?
      category: 'Webserver Content',
      attributes: {
        httpStatus: result.status
      },
      location: result.url
    }
  });

  /*{
    "id": "e18cdc5e-6b49-4346-b623-28a4e878e154",
    "name": "Open mysql Port",
    "description": "Port 3306 is open using tcp protocol.",
    "category": "Open Port",
    "parsed_at": "2021-06-22T12:27:28.153Z",
    "identified_at": "2021-06-22T12:26:54.378Z",
    "severity": "INFORMATIONAL",
    "attributes": {
    "port": 3306,
      "state": "open",
      "ip_address": "198.51.100.42",
      "mac_address": null,
      "protocol": "tcp",
      "hostname": "example.com",
      "method": "table",
      "operating_system": null,
      "service": "mysql",
      "serviceProduct": null,
      "serviceVersion": null,
      "scripts": null
  },
    "location": "tcp://127.0.0.1:3306"
  }*/
}

module.exports.parse = parse;
