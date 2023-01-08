// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const xml2js = require('xml2js');
const crypto = require("crypto");
const fs = require('fs');
const util = require('util');
// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

async function parse (fileContent, scan, encryptionKeyLocation = process.env['ENCRYPTION_KEY_LOCATION']) {
  const { ncrackrun } = await transformXML(fileContent);
  let publicKey = null;
  if (encryptionKeyLocation) {
    publicKey = await readPublicKey(encryptionKeyLocation)
      .catch(() => {
        console.log('Public key not found on file system location: ' + encryptionKeyLocation)
        process.exit()
      });
  }
  return transformToFindings(ncrackrun, publicKey);
}

function transformToFindings (ncrackrun, publicKey) {
  return ncrackrun.service.flatMap(({ address, port, credentials = [] }) => {
    const { addr: ipAddress } = address[0]['$'];
    const { protocol, portid, name: portName } = port[0]['$'];

    return credentials.map(credential => {
      let { username, password } = credential['$'];

      if (publicKey) {
        password = crypto.publicEncrypt({
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        }, Buffer.from(password)).toString("base64")
      }

      return {
        name: `Credentials for Service ${portName}://${ipAddress}:${portid} discovered via bruteforce.`,
        description: '',
        category: 'Discovered Credentials',
        ip_address: ipAddress,
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
}

function transformXML (fileContent) {
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

async function readPublicKey (keyLocation) {
  return readFile(keyLocation)
}

module.exports.parse = parse;
