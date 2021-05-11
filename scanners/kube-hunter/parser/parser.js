// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

async function parse({ vulnerabilities = [], nodes = [] }) {
  return vulnerabilities.map(vulnerability => {
    const reference = {}

    if ( vulnerability.vid !== "None") {
      reference.id = vulnerability.vid
      reference.source = `https://aquasecurity.github.io/kube-hunter/kb/${vulnerability.vid}`
    }

    let location = vulnerability.location;
    if (location.startsWith('Local to Pod')) {
      // This is a pod specific vulnarability.
      // As this does not fit the secureCodeBox model to well we will scope this to the first "Node/Master" type node of the cluster.
      // This is subject to change.

      for (const node of nodes) {
        if (node.type === "Node/Master") {
          location = node.location
          break;
        }
      }
    }

    return {
      name: vulnerability.vulnerability,
      description: vulnerability.description,
      location,
      severity: vulnerability.severity.toUpperCase(),
      category: vulnerability.category,
      reference,
      attributes: {
        evidence: vulnerability.evidence,
        kubeHunterRule: vulnerability.hunter,
      }
    };
  });
}

module.exports.parse = parse;
