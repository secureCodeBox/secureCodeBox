// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { parseString } from "xml2js";
import { publicEncrypt, constants } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function parse(
  fileContent,
  scan,
  encryptionKeyLocation = process.env["ENCRYPTION_KEY_LOCATION"],
) {
  const { ncrackrun } = await transformXML(fileContent);
  let publicKey = null;
  if (encryptionKeyLocation) {
    publicKey = await readPublicKey(encryptionKeyLocation).catch(() => {
      console.log(
        "Public key not found on file system location: " +
          encryptionKeyLocation,
      );
      process.exit();
    });
  }
  return transformToFindings(ncrackrun, publicKey);
}

function transformToFindings(ncrackrun, publicKey) {
  return ncrackrun.service.flatMap(({ address, port, credentials = [] }) => {
    const { addr: ipAddress } = address[0]["$"];
    const { protocol, portid, name: portName } = port[0]["$"];

    return credentials.map((credential) => {
      let { username, password } = credential["$"];

      if (publicKey) {
        password = publicEncrypt(
          {
            key: publicKey,
            padding: constants.RSA_PKCS1_OAEP_PADDING,
          },
          Buffer.from(password),
        ).toString("base64");
      }

      return {
        name: `Credentials for Service ${portName}://${ipAddress}:${portid} discovered via bruteforce.`,
        description: "",
        category: "Discovered Credentials",
        location: `${portName}://${ipAddress}:${portid}`,
        osi_layer: "APPLICATION",
        severity: "HIGH",
        mitigation:
          "Use a more secure password or disable the service at " +
          `${portName}://${ipAddress}:${portid}`,
        attributes: {
          port: portid,
          ip_addresses: [ipAddress],
          protocol: protocol,
          service: portName,
          username,
          password,
        },
      };
    });
  });
}

function transformXML(fileContent) {
  return new Promise((resolve, reject) => {
    parseString(fileContent, (err, xmlInput) => {
      if (err) {
        reject(new Error("Error converting XML to JSON in xml2js: " + err));
      } else {
        resolve(xmlInput);
      }
    });
  });
}

async function readPublicKey(keyLocation) {
  return readFile(keyLocation);
}
