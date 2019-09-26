const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

const { parse } = require('./parser');

test('', async () => {
  const xmlContent = await readFile(
    __dirname + '/__testFiles__/localhost.xml',
    {
      encoding: 'utf8',
    }
  );

  const res = await parse(xmlContent);

  expect(res).toEqual([
    {
      id: '49bf7fd3-8512-4d73-a28f-608e493cd726',
      name: 'domain',
      description: 'Port 53 is open using tcp protocol.',
      category: 'Open Port',
      location: 'tcp://127.0.0.1:53',
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
      attributes: {
        port: 53,
        state: 'open',
        ip_address: '127.0.0.1',
        mac_address: null,
        protocol: 'tcp',
        hostname: 'localhost',
        method: 'table',
        operating_system: null,
        service: 'domain',
        serviceProduct: null,
        serviceVersion: null,
        scripts: null,
      },
    },
    {
      id: '49bf7fd3-8512-4d73-a28f-608e493cd726',
      name: 'ftp-proxy',
      description: 'Port 8021 is open using tcp protocol.',
      category: 'Open Port',
      location: 'tcp://127.0.0.1:8021',
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
      attributes: {
        port: 8021,
        state: 'open',
        ip_address: '127.0.0.1',
        mac_address: null,
        protocol: 'tcp',
        hostname: 'localhost',
        method: 'table',
        operating_system: null,
        service: 'ftp-proxy',
        serviceProduct: null,
        serviceVersion: null,
        scripts: null,
      },
    },
    {
      id: '49bf7fd3-8512-4d73-a28f-608e493cd726',
      name: 'http-proxy',
      description: 'Port 8080 is open using tcp protocol.',
      category: 'Open Port',
      location: 'tcp://127.0.0.1:8080',
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
      attributes: {
        port: 8080,
        state: 'open',
        ip_address: '127.0.0.1',
        mac_address: null,
        protocol: 'tcp',
        hostname: 'localhost',
        method: 'table',
        operating_system: null,
        service: 'http-proxy',
        serviceProduct: null,
        serviceVersion: null,
        scripts: null,
      },
    },
    {
      id: '49bf7fd3-8512-4d73-a28f-608e493cd726',
      name: 'wap-wsp',
      description: 'Port 9200 is open using tcp protocol.',
      category: 'Open Port',
      location: 'tcp://127.0.0.1:9200',
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
      attributes: {
        port: 9200,
        state: 'open',
        ip_address: '127.0.0.1',
        mac_address: null,
        protocol: 'tcp',
        hostname: 'localhost',
        method: 'table',
        operating_system: null,
        service: 'wap-wsp',
        serviceProduct: null,
        serviceVersion: null,
        scripts: null,
      },
    },
    {
      id: '49bf7fd3-8512-4d73-a28f-608e493cd726',
      name: 'Host: localhost',
      category: 'Host',
      description: 'Found a host',
      location: 'localhost',
      severity: 'INFORMATIONAL',
      osi_layer: 'NETWORK',
      attributes: {
        ip_address: '127.0.0.1',
        hostname: 'localhost',
        operating_system: null,
      },
    },
  ]);
});
