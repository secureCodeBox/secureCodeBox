// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
  const targets = await parseResultFile(fileContent);
  return transformToFindings(targets);
}

function transformToFindings(targets) {

  const targetFindings = targets.map(target => {
    let finding = {
      name: target.uri,
      category: "WEB APPLICATION",
      description: target.title,
      location: target.uri,
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
      attributes: {
        requestConfig: target.requestConfig,
        ip_addresses: [target.ipAddress],
        country: target.country,
        HTML5: target.html5
      }
    };

    target.additional.forEach(additional => {
      if (!finding.attributes[additional[0]]) { //Check if key already exists
        finding.attributes[additional[0]] =
          (("string" in additional[1]) ? additional[1].string[0] : "") +
          (("module" in additional[1]) ? "/" + additional[1].module[0] : "");
      }
    });

    if (!finding.attributes.HTML5) //Do not show in findings if undefined
      delete finding.attributes.HTML5;

    return finding;
  });

  return [...targetFindings];
}

/**
 * Parses a given Whatweb JSON file and extracts all targets
 * @param {*} fileContent
 */
function parseResultFile(fileContent) {
    let targetList = [];

    for(const rawTarget of fileContent) {
      if (Object.keys(rawTarget).length > 0) { //Check for empty target
        let newTarget = {
          uri: rawTarget.target,
          httpStatus: rawTarget.http_status,
          requestConfig: rawTarget.request_config.headers["User-Agent"],
          ipAddress: null,
          title: null,
          html5: null,
          country: null,
          additional: []
        }
        if(rawTarget.plugins) {
          for(const [key, value] of Object.entries(rawTarget.plugins)) {
            switch(key) {
              case "IP": newTarget.ipAddress = value.string[0]; break;
              case "Title": newTarget.title = value.string[0]; break;
              case "HTML5": newTarget.html5 = true; break;
              case "Country": newTarget.country = value.string[0] + "/" + value.module[0]; break;
              default: newTarget.additional.push([key, value]);
            }
          }
        }
        targetList.push(newTarget);
      }
    }
    return targetList;
}

module.exports.parse = parse;
