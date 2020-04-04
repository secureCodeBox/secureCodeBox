const xml2js = require('xml2js');

async function parse(fileContent) {
  const hosts = await parseResultFile(fileContent);
  return transformToFindings(hosts);
}

function transformToFindings(hosts) {
  const portFindings = hosts.flatMap(({ openPorts = [], ...hostInfo }) => {
    if(openPorts === null){
      return [];
    }

    return openPorts.map(openPort => {
      return {
        name: openPort.service,
        description: `Port ${openPort.port} is ${openPort.state} using ${openPort.protocol} protocol.`,
        category: 'Open Port',
        location: `${openPort.protocol}://${hostInfo.ip}:${openPort.port}`,
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
        },
      };
    });
  });

  const hostFindings = hosts.map(({ hostname, ip, osNmap }) => {
    return {
      name: `Host: ${hostname}`,
      category: 'Host',
      description: 'Found a host',
      location: hostname,
      severity: 'INFORMATIONAL',
      osi_layer: 'NETWORK',
      attributes: {
        ip_address: ip,
        hostname: hostname,
        operating_system: osNmap,
      },
    };
  });

  return [...portFindings, ...hostFindings];
}

function parseResultFile(fileContent) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(fileContent, (err, xmlInput) => {
      if (err) {
        reject(new Error('Error converting XML to JSON in xml2js: ' + err));
      } else {
        let tempHostList = [];
        if (!xmlInput.nmaprun.host) {
          reject(new Error("Nmap result file didn't contain a valid host. This probably means that the target was specified incorrectly."));
        }

        xmlInput = xmlInput.nmaprun.host;

        tempHostList = xmlInput.map(host => {
          const newHost = {
            hostname: null,
            ip: null,
            mac: null,
            openPorts: null,
            osNmap: null,
          };

          //Get hostname
          if (
            host.hostnames &&
            host.hostnames[0] !== '\r\n' &&
            host.hostnames[0] !== '\n'
          ) {
            newHost.hostname = host.hostnames[0].hostname[0].$.name;
          }

          //get addresses
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

          //get ports
          if (host.ports && host.ports[0].port) {
            const portList = host.ports[0].port;

            const openPorts = portList.filter(port => {
              return port.state[0].$.state !== 'closed';
            });

            newHost.openPorts = openPorts.map(portItem => {
              // console.log(JSON.stringify(portItem, null, 4))

              const port = parseInt(portItem.$.portid, 10);
              const protocol = portItem.$.protocol;
              const service = portItem.service[0].$.name;
              const serviceProduct = portItem.service[0].$.product;
              const serviceVersion = portItem.service[0].$.version;

              const tunnel = portItem.service[0].$.tunnel;
              const method = portItem.service[0].$.method;
              const product = portItem.service[0].$.tunnel;

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
