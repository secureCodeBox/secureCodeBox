// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const xml2js = require('xml2js');
const { get, merge } = require('lodash');


async function parse(fileContent) {
  const hosts = await parseResultFile(fileContent);
  return transformToFindings(hosts);
}

function transformToFindings(hosts) {

  const scriptFindings = transformNMAPScripts(hosts);

  const portFindings = hosts.flatMap(({ openPorts = [], ...hostInfo }) => {
    if(openPorts === null){
      return [];
    }

    return openPorts.map(openPort => {
      return {
        name: openPort.service ? `Open Port: ${openPort.port} (${openPort.service})`: `Open Port: ${openPort.port}`,
        description: `Port ${openPort.port} is ${openPort.state} using ${openPort.protocol} protocol.`,
        category: 'Open Port',
        ip_address: hostInfo.ip,
        hostname: hostInfo.hostname,
        osi_layer: 'NETWORK',
        severity: 'INFORMATIONAL',
        attributes: {
          port: openPort.port,
          state: openPort.state,
          ip_address: hostInfo.ip,
          mac_address: hostInfo.mac,
          protocol: openPort.protocol,
          hostname: hostInfo.hostname,
          method: openPort.method,
          operating_system: hostInfo.osNmap,
          service: openPort.service,
          serviceProduct: openPort.serviceProduct || null,
          serviceVersion: openPort.serviceVersion || null,
          scripts: openPort.scriptOutputs || null,
          tunnel: openPort.tunnel || null,
        },
      };
    });
  });

  const hostFindings = hosts.map(({ hostname, ip, osNmap }) => {
    return {
      name: `Host: ${hostname}`,
      category: 'Host',
      description: 'Found a host',
      hostname: hostname,
      ip_address: ip,
      severity: 'INFORMATIONAL',
      osi_layer: 'NETWORK',
      attributes: {
        ip_address: ip,
        hostname: hostname,
        operating_system: osNmap,
      },
    };
  });

  return [...portFindings, ...hostFindings, ...scriptFindings];
}

function transformNMAPScripts(hosts) {
  let scriptFindings = [];

  for(const host of hosts) {

    if(host.scripts) {
      for(const script of host.scripts) {
        // Parse Script Results
        const parseFunction = scriptParser[script.$.id];
        if (parseFunction) {
          scriptFindings = scriptFindings.concat(parseFunction(host, script));
        }
      }
    }
  }

  return scriptFindings;
}

const scriptParser = {
  "ftp-anon": parseFtpAnon,
  "banner": parseBanner,
  "smb-protocols": parseSmbProtocols,
}

function parseFtpAnon(host, script) {
  return [merge(
    {
    name: "Anonymous FTP Login possible",
    description: `Port ${host.openPorts[0].port} allows anonymous FTP login`,
    severity: 'MEDIUM',
  },
    parseFtpCommon(host, script)
  )]
}

function parseBanner(host, script) {
  return [merge(
    {
      name: "Server banner found",
      description: `Port ${host.openPorts[0].port} displays banner`,
      severity: 'INFORMATIONAL',
      attributes: {
        banner: script.$.output || null,
      },
    },
    host.openPorts[0].port === 21 ? parseFtpCommon(host, script) : parseCommon(host,script)
  )]
}

function parseFtpCommon(host, script) {
  return {
    category: 'FTP',
    ip_address: host.ip,
    osi_layer: 'NETWORK',
    attributes: {
      script: script.$.id || null,
      protocol: 'ftp',
      port: host.openPorts[0].port
    },
  }
}

function parseCommon(host, script) {
  return {
    category: 'TCP',
    ip_address: host.ip,
    osi_layer: 'NETWORK',
    attributes: {
      script: script.$.id || null,
      protocol: 'tcp',
      port: host.openPorts[0].port
    },
  }
}

function parseSmbProtocols(host, script) {
  // Parse SMB Script Results
  console.log ("Found SMB Script Result: " + script.$.output);
  //console.log (script);

  var scriptFindings = [];

  if(script.table && script.table[0] && script.table[0].elem) {

    for(const elem of script.table[0].elem) {
      console.log ("Found SMB SMB Protocol: " + elem);
      //console.log (elem);

      const smbVersion = elem.toString().includes("SMBv1") ? 1 : parseFloat(elem);

      const attributes = {
              hostname: host.hostname,
              mac_address: host.mac || null,
              ip_address: host.ip,
              port: host.openPorts[0].port,
              state: host.openPorts[0].state,
              protocol: host.openPorts[0].protocol,
              method: host.openPorts[0].method,
              operating_system: host.osNmap || null,
              service: host.openPorts[0].service,
              serviceProduct: host.openPorts[0].serviceProduct || null,
              serviceVersion: host.openPorts[0].serviceVersion || null,
              scripts: elem || null,
              smb_protocol_version: smbVersion,
            }

      if(elem.toString().includes("SMBv1")) {
        scriptFindings.push({
          name: "SMB Dangerous Protocol Version Finding SMBv1",
          description: `Port ${host.openPorts[0].port} is ${host.openPorts[0].state} using SMB protocol with an old version: SMBv1`,
          category: 'SMB',
          ip_address: host.ip,
          osi_layer: 'NETWORK',
          severity: 'HIGH',
          attributes: attributes
        });
      }
      else if(!isNaN(smbVersion)) {
        if(smbVersion > 0 && smbVersion < 2) {
          scriptFindings.push({
            name: "SMB Dangerous Protocol Version Finding v"+smbVersion,
            description: `Port ${host.openPorts[0].port} is ${host.openPorts[0].state} using SMB protocol with an old version: ` + smbVersion,
            category: 'SMB',
            ip_address: host.ip,
            osi_layer: 'NETWORK',
            severity: 'MEDIUM',
            attributes: attributes
          });
        }
        else if(smbVersion >= 2 && smbVersion < 3) {
          scriptFindings.push({
            name: "SMB Protocol Version Finding v"+smbVersion,
            description: `Port ${host.openPorts[0].port} is ${host.openPorts[0].state} using SMB protocol with an old version: `+ smbVersion,
            category: 'SMB',
            ip_address: host.ip,
            osi_layer: 'NETWORK',
            severity: 'LOW',
            attributes: attributes
          });
        }
        else if(smbVersion >= 3) {
          scriptFindings.push({
            name: "SMB Protocol Version Finding v"+smbVersion,
            description: `Port ${host.openPorts[0].port} is ${host.openPorts[0].state} using SMB protocol with version: ` + smbVersion,
            category: 'SMB',
            ip_address: host.ip,
            osi_layer: 'NETWORK',
            severity: 'INFORMATIONAL',
            attributes: attributes
          });
        }
      }
    }
  }
  return scriptFindings
}

/**
 * Parses a given NMAP XML file to a smaller JSON representation with the following object:
 * {
 *   hostname: null,
 *   ip: null,
 *   mac: null,
 *   openPorts: null,
 *   osNmap: null,
 *   scripts: null
 * }
 * @param {*} fileContent 
 */
function parseResultFile(fileContent) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(fileContent, (err, xmlInput) => {
      if (err) {
        reject(new Error('Error converting XML to JSON in xml2js: ' + err));
      } else {
        let tempHostList = [];
        if (!xmlInput.nmaprun.host) {
          resolve([]);
          return;
        }

        xmlInput = xmlInput.nmaprun.host;

        tempHostList = xmlInput.map(host => {
          const newHost = {
            hostname: null,
            ip: null,
            mac: null,
            openPorts: null,
            osNmap: null,
            scripts: null
          };

          // Get hostname
          if (
            host.hostnames &&
            host.hostnames[0] !== '\r\n' &&
            host.hostnames[0] !== '\n'
          ) {
            newHost.hostname = host.hostnames[0].hostname[0].$.name;
          }

          // Get addresses
          host.address.forEach(address => {
            const addressType = address.$.addrtype;
            const addressAdress = address.$.addr;
            const addressVendor = address.$.vendor;

            if (addressType === 'ipv4') {
              newHost.ip = addressAdress;
            } else if (addressType === 'mac') {
              newHost.mac = addressAdress;
              newHost.vendor = addressVendor;
            }
          });

          // Get ports
          if (host.ports && host.ports[0].port) {
            const portList = host.ports[0].port;

            const openPorts = portList.filter(port => {
              return port.state[0].$.state !== 'closed';
            });

            newHost.openPorts = openPorts.map(portItem => {
              // console.log(JSON.stringify(portItem, null, 4))

              const port = parseInt(portItem.$.portid, 10);
              const protocol = portItem.$.protocol;
              const service = get(portItem, ["service",0,"$","name"]);
              const serviceProduct = get(portItem, ["service",0,"$","product"]);
              const serviceVersion = get(portItem, ["service",0,"$","version"]);

              const tunnel = get(portItem, ["service",0,"$","tunnel"]);
              const method = get(portItem, ["service",0,"$","method"]);
              const product = get(portItem, ["service",0,"$","tunnel"]);

              const state = portItem.state[0].$.state;

              let scriptOutputs = null;

              if (portItem.script) {
                scriptOutputs = portItem.script.reduce(
                  (carry, { $: scriptRes }) => {
                    carry[scriptRes.id] = scriptRes.output;
                    return carry;
                  },
                  {}
                );
              }

              let portObject = {};
              if (port) portObject.port = port;
              if (protocol) portObject.protocol = protocol;
              if (service) portObject.service = service;
              if (serviceProduct) portObject.serviceProduct = serviceProduct;
              if (serviceVersion) portObject.serviceVersion = serviceVersion;

              if (tunnel) portObject.tunnel = tunnel;
              if (method) portObject.method = method;
              if (product) portObject.product = product;

              if (state) portObject.state = state;

              if (scriptOutputs) portObject.scriptOutputs = scriptOutputs;

              return portObject;
            });
          }

          // Get Script Content
          if(host.hostscript && host.hostscript[0].script) {
            newHost.scripts = host.hostscript[0].script
          }
          // Get Script Content in case the script is of the port-rule type,
          // and thus has the script under 'port' instead of 'hostscript'.
          else if(host.ports && host.ports[0].port){
            for (let i=0; i < host.ports[0].port.length; i++){
              if ((host.ports[0].port)[i].script) {
                newHost.scripts = host.ports[0].port[i].script
              }
            }
          }
          if (host.os && host.os[0].osmatch && host.os[0].osmatch[0].$.name) {
            newHost.osNmap = host.os[0].osmatch[0].$.name;
          }
          return newHost;
        });

        resolve(tempHostList);
      }
    });
  });
}

module.exports.parse = parse;
