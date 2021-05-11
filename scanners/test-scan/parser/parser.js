// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

async function parse() {
  return [
    {
      name: "Test read-write-hook service",
      description: `Port is using protocol.`,
      category: "Open Port",
      location: `tcp://rw-hook-test:80`,
      osi_layer: "NETWORK",
      severity: "INFORMATIONAL",
      attributes: {
        port: 80,
        state: "Open",
        ip_address: "host ip address",
        mac_address: "hostInfo.mac",
        protocol: "openPort.protocol",
        hostname: "hostInfo.hostname",
        method: "openPort.method",
        operating_system: "hostInfo.osNmap",
        service: "openPort.service",
        serviceProduct: "openPort.serviceProduct",
        serviceVersion: "openPort.serviceVersion",
        scripts: "openPort.scriptOutputs",
      },
    },
    {
      name: `Host: hostname`,
      category: "Host",
      description: "Found a host",
      location: "hostname",
      severity: "INFORMATIONAL",
      osi_layer: "NETWORK",
      attributes: {
        ip_address: "ip address",
        hostname: "hostname",
        operating_system: "osNmap",
      },
    },
  ];
}

module.exports.parse = parse;
