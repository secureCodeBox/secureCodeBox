const xml2js = require('xml2js');

async function parse(fileContent) {
    const { ncrackrun } = await transformXML(fileContent);
    const findings = transformToFindings(ncrackrun);
    return findings;
}

function transformToFindings(ncrackrun) {
    const portFindings = ncrackrun.service.flatMap(({ address, port, credentials = [] }) => {
        const { addr: ipAddress } = address[0]['$'];
        const { protocol, portid, name: portName } = port[0]['$'];

        return credentials.map(credential => {
            const { username, password } = credential['$'];

            return {
                name: `Credentials for Service ${portName}://${ipAddress}:${portid} discovered via bruteforce.`,
                description: '',
                category: 'Discovered Credentials',
                location: `${portName}://${ipAddress}:${portid}`,
                osi_layer: 'APPLICATION',
                severity: 'HIGH',
                attributes: {
                    port: portid,
                    ip_address: ipAddress,
                    protocol: protocol,
                    service: portName,
                    username,
                    password,
                },
            };
        });
    });

    return portFindings;
}

function transformXML(fileContent) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(fileContent, (err, xmlInput) => {
            if (err) {
                reject(new Error('Error converting XML to JSON in xml2js: ' + err));
            } else {
                resolve(xmlInput);
            }
        });
    });
}

module.exports.parse = parse;
