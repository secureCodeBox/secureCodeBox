function riskToSeverity(risk) {
  switch (parseInt(risk, 10)) {
    case 0:
      return "INFORMATIONAL";
    case 1:
      return "LOW";
    case 2:
      return "MEDIUM";
    default:
      return "HIGH";
  }
}

function stripHtmlTags(str) {
  if (!str || str === null || str === "") {
    return false;
  } else {
    str = str.toString();
  }
  return str.replace(/<[^>]*>/g, "");
}

function truncate({ text, maxLength = 2048 }) {
  if (!text || text.length < maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

async function parse(fileContent) {
  return fileContent.site.flatMap(
    ({ "@name": location, "@host": host, alerts }) => {
      return alerts.map((alert) => {
        return {
          name: stripHtmlTags(alert.name),
          description: stripHtmlTags(alert.desc),
          hint: alert.hint,
          category: alert.alert || stripHtmlTags(alert.name),
          location,
          osi_layer: "APPLICATION",
          severity: riskToSeverity(alert.riskcode),
          attributes: {
            host: host,
            zap_confidence: alert.confidence || null,
            zap_count: alert.count || null,
            zap_solution: stripHtmlTags(alert.solution) || null,
            zap_otherinfo: truncate({
              text: stripHtmlTags(alert.otherinfo) || null,
              maxLength: 2048,
            }),
            zap_reference: stripHtmlTags(alert.reference) || null,
            zap_cweid: alert.cweid || null,
            zap_wascid: alert.wascid || null,
            zap_riskcode: alert.riskcode || null,
            zap_pluginid: alert.pluginid || null,
            zap_finding_urls: alert.instances || null,
          },
        };
      });
    }
  );
}

module.exports.parse = parse;
