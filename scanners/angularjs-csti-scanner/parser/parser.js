// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {

  if (fileContent.length === 0) {
    return []
  }

  const lines = fileContent.split('\n')
  lines.splice(-1, 1)

  return lines.map(line => {
    const method = parseMethod(line)
    const url = parseUrl(line)
    const data = parseData(line, method.length)
    let parameter = null
    let injectedTemplate = null
    if (data.length > 5) {
      parameter = data.substring(0, data.indexOf('='))
      injectedTemplate = data.substring(data.indexOf('=') + 1)
    }

    return {
      name: 'AngularJS template injection',
      description: 'The given in this finding URL is vulnerable to AngularJS template injection which can lead to XSS',
      osi_layer: 'APPLICATION',
      severity: 'HIGH',
      category: 'Template Injection',
      attributes: {
        url: url,
        method: method,
        parameter: parameter,
        injectedTemplate: injectedTemplate,
      }
    }
  })
}

function parseMethod(line) {
  return line.substring(0, line.indexOf('('))
}

function parseUrl(line) {
  return line.match(/http[s]?:\/\/[^\n ]+/g)[0]
}

function parseData(line, start) {
  return line.substring(start + 1, line.indexOf('): '))
}


module.exports.parse = parse
