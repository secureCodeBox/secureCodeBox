// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

function createDropCapabilityFinding({ Capability, Container, msg }) {
  return {
    name: `Capability '${Capability}' Not Dropped`,
    description: msg,
    category: "Capability Not Dropped",
    location: `container://${Container}`,
    osi_layer: "NOT_APPLICABLE",
    severity: "LOW",
    attributes: {
      capability: Capability,
      container: Container,
    },
  };
}

function createNonReadOnlyRootFsFinding({ Container, msg }) {
  return {
    name: `Container Uses a non ReadOnly Root Filesystem`,
    description: msg,
    category: "Non ReadOnly Root Filesystem",
    location: `container://${Container}`,
    osi_layer: "NOT_APPLICABLE",
    severity: "LOW",
    attributes: {
      container: Container,
    },
  };
}

function createPrivilegedContainerFinding({ Container, msg }) {
  return {
    name: `Container using Privileged Flag`,
    description: msg,
    category: "Privileged Container",
    location: `container://${Container}`,
    osi_layer: "NOT_APPLICABLE",
    severity: "HIGH",
    attributes: {
      container: Container,
    },
  };
}

function createAutomountedServiceAccountTokenFinding({ msg }) {
  return {
    name: `Default ServiceAccount uses Automounted Service Account Token`,
    description: msg,
    category: "Automounted ServiceAccount Token",
    location: null,
    osi_layer: "NOT_APPLICABLE",
    severity: "LOW",
    attributes: {},
  };
}

function createNonRootUserNotEnforcedFinding({ msg, Container }) {
  return {
    name: `NonRoot User not enforced for Container`,
    description: msg,
    category: "Non Root User Not Enforced",
    location: `container://${Container}`,
    osi_layer: "NOT_APPLICABLE",
    severity: "MEDIUM",
    attributes: {
      container: Container,
    },
  };
}

function createMissingNetworkPolicyFinding({ msg, Namespace }) {
  return {
    name: `Namespace "${Namespace}" is missing a Default Deny NetworkPolicy`,
    description: msg,
    category: "No Default Deny NetworkPolicy",
    location: `namespace://${Namespace}`,
    osi_layer: "NOT_APPLICABLE",
    severity: "MEDIUM",
    attributes: {
      Namespace: Namespace,
    },
  };
}

async function parse(fileContent) {
  return fileContent
    .split("\n")
    .filter(Boolean)
    .filter((line) => line && line.startsWith("{") && line.endsWith("}"))
    .map(JSON.parse)
    .map((finding) => {
      if (!finding || !finding.AuditResultName) {
        return null;
      }

      if (finding.AuditResultName === "CapabilityNotDropped") {
        return createDropCapabilityFinding(finding);
      }
      if (
        finding.AuditResultName === "ReadOnlyRootFilesystemFalse" ||
        finding.AuditResultName === "ReadOnlyRootFilesystemNil"
      ) {
        return createNonReadOnlyRootFsFinding(finding);
      }
      if (finding.AuditResultName === "PrivilegedTrue") {
        return createPrivilegedContainerFinding(finding);
      }
      if (
        finding.AuditResultName ===
        "AutomountServiceAccountTokenTrueAndDefaultSA"
      ) {
        return createAutomountedServiceAccountTokenFinding(finding);
      }
      if (
        finding.AuditResultName === "RunAsNonRootCSCFalse" ||
        finding.AuditResultName === "RunAsNonRootPSCNilCSCNil" ||
        finding.AuditResultName === "RunAsNonRootPSCFalseCSCNil"
      ) {
        return createNonRootUserNotEnforcedFinding(finding);
      }
      if (
        finding.AuditResultName === "MissingDefaultDenyIngressAndEgressNetworkPolicy"
      ) {
        return createMissingNetworkPolicyFinding(finding);
      }

      return null;
    })
    .filter(Boolean);
}

module.exports.parse = parse;
