// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const xml2js = require('xml2js');

async function parse(fileContent) {
  const hosts = await parseResultFile(fileContent);
  return transformToFindings(hosts);
}

function transformToFindings(targets) {

  const targetFindings = targets.map(target => {
    let tempFinding = {
      name: target.uri,
      category: "WEB APPLICATION",
      description: target.title,
      location: target.ipAddress,
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
      attributes: {
        requestConfig: target.requestConfig
      }
    };

    target.additional.forEach(additional => {
      if (!tempFinding.attributes[additional.name[0]]) {
        tempFinding.attributes[additional.name[0]] =
          (("string" in additional) ? additional.string[0] : "") + (("module" in additional) ? " " + additional.module[0] : "");
      }
    });

    return tempFinding;
  });

  return [...targetFindings];
}

/**
 * Parses a given NMAP XML file to a smaller JSON represenation with the following object:
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
        let tempTargetList = [];
        if (!xmlInput.log.target) {
          resolve([]);
          return;
        }

        xmlInput = xmlInput.log.target;

        tempTargetList = xmlInput.map(target => {
          let newTarget = {
            uri: target.uri[0],
            httpStatus: target['http-status'][0],
            requestConfig: {
                headerName: target['request-config'][0].header[0]["header-name"][0],
                headerValue: target['request-config'][0].header[0]["header-value"][0]
            },
            ipAddress: null,
            title: null,
            additional: []
          };

          if(target.plugin) {
            for(const plugin of target.plugin) {
              if (plugin.name[0] === "IP")
              newTarget.ipAddress = plugin.string[0];
              else if (plugin.name[0] === "Title")
              newTarget.title = plugin.string[0];
              else
              newTarget.additional.push(plugin)
            }
          }
            
          return newTarget;
        });

        resolve(tempTargetList);
      }
    });
  });
}

module.exports.parse = parse;
