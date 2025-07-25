// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

export function parse(fileContent) {
  if (!fileContent) {
    return [];
  }

  const report = JSON.parse(fileContent);

  // Only 0 when the target wasn't reachable
  if (!report.server_scan_results || report.server_scan_results.length === 0) {
    return [];
  }

  const serverScanResult = report.server_scan_results[0];

  if (serverScanResult.connectivity_status == "ERROR") {
    console.error(
      "Cannot parse the result file, as some of the scan parts failed.",
    );
    return [];
  }

  if (process.env["DEBUG"] === "true") {
    console.log("Parsing Result File");
    console.log(fileContent);
  }

  if (report.date_scans_completed) {
    serverScanResult.identified_at = new Date(
      report.date_scans_completed,
    ).toISOString();
  }

  const partialFindings = [
    generateInformationalServiceFinding(serverScanResult),
    ...generateVulnerableTLSVersionFindings(serverScanResult),
    ...analyseCertificateDeployments(serverScanResult),
  ];

  const { ip_address, hostname, port } = serverScanResult.server_location;
  const location = `${hostname || ip_address}:${port}`;

  // Enhance partialFindings with common properties shared across all SSLyze findings
  const findings = partialFindings.map((partialFinding) => {
    return {
      osi_layer: "PRESENTATION",
      reference: null,
      location,
      ...partialFinding,
      attributes: {
        hostname,
        ip_addresses: [ip_address],
        port,
        ...(partialFinding.attributes || {}),
      },
    };
  });

  return findings;
}

// Returns the Scan Result for the individual TLS Versions as array
function getTlsScanResultsAsArray(serverScanResult) {
  const commandResult = serverScanResult.scan_result;
  return [
    { name: "SSL 2.0", ...commandResult.ssl_2_0_cipher_suites.result },
    { name: "SSL 3.0", ...commandResult.ssl_3_0_cipher_suites.result },
    { name: "TLS 1.0", ...commandResult.tls_1_0_cipher_suites.result },
    { name: "TLS 1.1", ...commandResult.tls_1_1_cipher_suites.result },
    { name: "TLS 1.2", ...commandResult.tls_1_2_cipher_suites.result },
    { name: "TLS 1.3", ...commandResult.tls_1_3_cipher_suites.result },
  ];
}

// Returns all supported cipher suites across all tls and ssl version as one big string array
function getAllAcceptedCipherSuites(serverScanResult) {
  const tlsScanResults = getTlsScanResultsAsArray(serverScanResult);

  // Use set to eliminate duplicates automatically
  const supportedVersions = new Set();

  for (const tlsScanResult of tlsScanResults) {
    for (const acceptedCipherSuit of tlsScanResult.accepted_cipher_suites ||
      []) {
      supportedVersions.add(acceptedCipherSuit.cipher_suite.openssl_name);
    }
  }

  // return set as a array
  return [...supportedVersions.values()];
}

// Returns all supported tls versions as a string array
function getAllSupportedTlsVersions(serverScanResult) {
  const tlsScanResults = getTlsScanResultsAsArray(serverScanResult);

  const supportedVersions = [];

  for (const tlsScanResult of tlsScanResults) {
    // Should have at least one accepted cipher suite to be considered "supported"
    if (
      tlsScanResult.accepted_cipher_suites &&
      tlsScanResult.accepted_cipher_suites.length > 0
    ) {
      supportedVersions.push(tlsScanResult.name);
    }
  }

  return supportedVersions;
}

function generateInformationalServiceFinding(serverScanResult) {
  return {
    name: "TLS Service",
    description: "",
    identified_at: serverScanResult.identified_at,
    category: "TLS Service Info",
    severity: "INFORMATIONAL",
    mitigation: null,
    attributes: {
      tls_versions: getAllSupportedTlsVersions(serverScanResult),
      cipher_suites: getAllAcceptedCipherSuites(serverScanResult),
    },
  };
}

function generateVulnerableTLSVersionFindings(serverScanResult) {
  const supportedTlsVersions = getAllSupportedTlsVersions(serverScanResult);

  const DEPRECATED_VERSIONS = ["SSL 2.0", "SSL 3.0", "TLS 1.0", "TLS 1.1"];

  const findings = supportedTlsVersions
    .filter((tlsVersion) => DEPRECATED_VERSIONS.includes(tlsVersion))
    .map((tlsVersion) => {
      return {
        name: `TLS Version ${tlsVersion} is considered insecure`,
        category: "Outdated TLS Version",
        description: "The server uses outdated or insecure tls versions.",
        identified_at: serverScanResult.identified_at,
        severity: "MEDIUM",
        mitigation: "Upgrade to a higher tls version.",
        attributes: {
          outdated_version: tlsVersion,
        },
      };
    });

  return findings;
}

function analyseCertificateDeployments(serverScanResult) {
  if (
    serverScanResult?.scan_result?.certificate_info?.result
      ?.certificate_deployments
  ) {
    const certificateInfos =
      serverScanResult.scan_result.certificate_info.result.certificate_deployments.map(
        analyseCertificateDeployment,
      );
    // If at least one cert is totally trusted no finding should be created
    if (certificateInfos.every((certInfo) => certInfo.trusted)) {
      return [];
    }

    // No Cert Deployment is trusted, creating individual findings

    const findingTemplates = [];
    for (const certInfo of certificateInfos) {
      if (certInfo.matchesHostname === false) {
        findingTemplates.push({
          name: "Invalid Hostname",
          description:
            "Hostname of Server didn't match the certificates subject names",
        });
      } else if (certInfo.selfSigned === true) {
        findingTemplates.push({
          name: "Self-Signed Certificate",
          description: "Certificate is self-signed",
        });
      } else if (certInfo.expired === true) {
        findingTemplates.push({
          name: "Expired Certificate",
          description: "Certificate has expired",
        });
      } else if (certInfo.untrustedRoot === true) {
        findingTemplates.push({
          name: "Untrusted Certificate Root",
          description:
            "The certificate chain contains a certificate not trusted ",
        });
      }
    }

    return findingTemplates.map((findingTemplate) => {
      return {
        name: findingTemplate.name,
        category: "Invalid Certificate",
        description: findingTemplate.description,
        identified_at: serverScanResult.identified_at,
        severity: "MEDIUM",
        mitigation: null,
        attributes: {},
      };
    });
  } else {
    // No certificate info found
    return [
      {
        name: "ASN.1 Parsing Error",
        category: "Invalid Certificate",
        description:
          "An error occurred while parsing the ASN.1 value in the certificate. This may be due to a corrupted certificate, improper formatting, or incompatibility with the cryptography library.",
        identified_at: serverScanResult.identified_at,
        severity: "MEDIUM",
        mitigation:
          "Verify the integrity of the certificate, or inspect the certificate for custom or non-standard extensions.",
        attributes: {},
      },
    ];
  }
}

function analyseCertificateDeployment(certificateDeployment) {
  const errorsAcrossAllTruststores = new Set();

  for (const {
    validation_error,
  } of certificateDeployment.path_validation_results) {
    if (validation_error !== null) {
      errorsAcrossAllTruststores.add(validation_error);
    }
  }

  // Access the leaf certificate in the chain
  const leafCertificate = certificateDeployment.received_certificate_chain[0];

  // Check if the certificate is self-signed by comparing subject and issuer
  const isSelfSigned =
    leafCertificate.subject.rfc4514_string ===
    leafCertificate.issuer.rfc4514_string;

  // Determine if the certificate is missing required extension
  const hasMissingRequiredExtension = errorsAcrossAllTruststores.has(
    'validation failed: Other("Certificate is missing required extension")',
  );

  return {
    // To be trusted no openssl errors should have occurred and should match hostname
    trusted: errorsAcrossAllTruststores.size === 0,
    matchesHostname: !errorsAcrossAllTruststores.has(
      'validation failed: Other("leaf certificate has no matching subjectAltName")',
    ),
    selfSigned: isSelfSigned,
    expired: errorsAcrossAllTruststores.has(
      'validation failed: Other("cert is not valid at validation time")',
    ),
    untrustedRoot: hasMissingRequiredExtension && !isSelfSigned,
  };
}
