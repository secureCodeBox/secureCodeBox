function riskToSeverity(risk) {
  switch (parseInt(risk, 10)) {
    case 0:
      return 'INFORMATIONAL';
    case 1:
      // ZAP doesn't have a difference between Low and Medium Serverity
      return 'MEDIUM';
    case 2:
      return 'HIGH';
  }
}

async function parse(fileContent) {
  return fileContent.site.flatMap(
    ({ '@name': location, '@host': host, alerts }) => {
      return alerts.map(alert => {
        return {
          name: alert.name,
          description: alert.desc,
          hint: alert.hint,
          category: alert.alert || alert.name,
          location,
          osi_layer: 'APPLICATION',
          severity: riskToSeverity(alert.riskcode),
          attributes: {
            host,
          },
        };
      });
    }
  );
}

module.exports.parse = parse;
