const uuid = require('uuid/v4');

async function parse(fileContent) {
  fileContent.map(() => {
    return {
      id: uuid(),
      name: 'Some name',
      description: `Some description`,
      category: 'Example Category',
      location: `example.com`,
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
      attributes: {
        
      }, 
    }
  })
}

module.exports.parse = parse;
