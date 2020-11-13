const arg = require("arg");

async function parse(image) {

  if (image.length === 0) {
    return []
  }

  const websiteUrl = scan.spec.parameters[0];
  const downloadLink = scan.status.rawResultDownloadLink;

  return [
    {
      name: `Screenshot for ${websiteUrl}`,
      description: `Took a Screenshot for website: '${websiteUrl}'`,
      category: "Screenshot",
      location: websiteUrl,
      osi_layer: "APPLICATION",
      severity: "INFORMATIONAL",
      attributes: {
        downloadLink,
      },
    },
  ];
}

module.exports.parse = parse;
