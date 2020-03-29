/*
 *
 *  SecureCodeBox (SCB)
 *  Copyright 2015-2018 iteratec GmbH
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  	http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * /
 */
const sprintf_js = require("sprintf-js");
const sprintf = sprintf_js.sprintf;

/**
 * Enum for representing the different OSI layers
 */
const OsiLayer = Object.freeze({
  APPLICATION: "APPLICATION",
  PRESENTATION: "PRESENTATION",
  SESSION: "SESSION",
  TRANSPORT: "TRANSPORT",
  NETWORK: "NETWORK",
  DATA_LINK: "DATA_LINK",
  PHYSICAL: "PHYSICAL",
  NOT_APPLICABLE: "NOT_APPLICABLE"
});

/**
 * Enum for representing the different severity levels
 */
const Severity = Object.freeze({
  INFORMATIONAL: "INFORMATIONAL",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
});

/**
 * Enum for representing the different finding types
 */
const FindingCategory = Object.freeze({
  CERT_INFO: "Certificate info",
  COMPRESSION: "Compression",
  FALLBACK: "Fallback",
  HEARTBLEED: "Heartbleed",
  CCS: "CCS",
  RENEG: "Renegotiation",
  RESUM: "Resumption",
  ROBOT: "Robot",
  SSLV2: "SSLv2",
  SSLV3: "SSLv3",
  TLSV1: "TLSv1",
  TLSV1_1: "TLSv1.1",
  TLSV1_2: "TLSv1.2",
  TLSV1_3: "TLSv1.3"
});

/**
 * Prototypes are used as a base when constructing new findings
 */
const FindingPrototypes = Object.freeze({
  // Certificate info findings
  CERTINFO_ERROR: {
    name: "Certificate info error",
    description: "Certificate info could not be retrieved due to error: %s",
    osi_layer: OsiLayer.NOT_APPLICABLE,
    severity: Severity.HIGH,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_CERTIFICATE_NOT_TRUSTED: {
    name: "Certificate is not trusted",
    description: "At least one chain certificate is not trusted using the supplied trust store %s. Validation result: %s",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.MEDIUM,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_MUST_STAPLE_UNSUPPORTED: {
    name: "Must-Staple unsupported",
    description: "Leaf certificate does not support OCSP Must-Staple extension as defined in RFC 6066.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_INCLUDES_SCTS_COUNT: {
    name: "Certificate includes SCTS count",
    description: "The number of Signed Certificate Timestamps (SCTs) for Certificate Transparency is embedded in the leaf certificate. Its value is %d.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_ANCHOR_IN_CERTIFICATE_CHAIN: {
    name: "Anchor certificate sent",
    description: "Received certificate chain contains the anchor certificate.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_SHA1_IN_CERTIFICATE_CHAIN: {
    name: "SHA1 in certificate chain",
    description: "Some of the leaf or intermediate certificates are signed using the SHA-1 algorithm.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.HIGH,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_CHAIN_ORDER_INVALID: {
    name: "Chain order invalid",
    description: "The chain order sent by the server is invalid.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_NOT_EV: {
    name: "No extended validation certificate",
    description: "The certificate has not been validated by the certificate authority according to the standardized set of requirements set out in the CA/Browser Forum Extended Validation Certificate Guidelines. (https://wiki.mozilla.org/EV)",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_NO_OCSP_RESPONSE: {
    name: "No OCSP response",
    description: "The server did not send an OCSP response.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_OCSP_RESPONSE_IS_NOT_TRUSTED: {
    name: "OCSP response not trusted",
    description: "The server sent an OCSP response which is not trusted using the Mozilla trust store.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.MEDIUM,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_HAS_PATH_VALIDATION_ERROR: {
    name: "Certificate chain validation error",
    description: "An error occurred while attempting to validate the server's certificate chain: %s",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.MEDIUM,
    category: FindingCategory.CERT_INFO
  },
  CERTINFO_WILL_BE_DISTRUSTED: {
    name: "Certificate will be distrusted",
    description: "The certificate was issued by one of the Symantec Legacy CAs and will be distrusted in Chrome and Firefox.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.CERT_INFO
  },
  // Compression findings
  COMPRESSION_METHOD_EXPOSED: {
    name: "Compression method exposed",
    description: "The server supports the compression algorithm %s.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.COMPRESSION
  },
  // Fallback findings
  FALLBACK_NO_SCSV_SUPPORT: {
    name: "No SCSV fallback support",
    description: "The server does not support the SCSV cipher suite which would prevent downgrade attacks if it was supported.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.FALLBACK
  },
  // Heartbleed findings
  HEARTBLEED_VULNERABLE: {
    name: "Vulnerable to Heartbleed",
    description: "The server is vulnerable to the Heartbleed attack.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.HIGH,
    category: FindingCategory.HEARTBLEED
  },
  // CCS injection findings
  CCS_VULNERABLE: {
    name: "Vulnerable to CCS injection",
    description: "The server is vulnerable to OpenSSL's CCS injection issue.", // eslint-disable-line
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.HIGH,
    category: FindingCategory.CCS
  },
  // Renegotiation findings
  RENEG_ACCEPTED: {
    name: "Accepts client renegotiation",
    description: "The server honors client-initiated renegotiation attempts.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.HIGH,
    category: FindingCategory.RENEG
  },
  RENEG_NO_SECURE_SUPPORT: {
    name: "No support for secure renegotiation",
    description: "The server does not support secure renegotiation.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.HIGH,
    category: FindingCategory.RENEG
  },
  // Session resumption findings
  RESUM_ERROR: {
    name: "Session resumption error",
    description: "Session resumption information could not be retrieved due to error: %s",
    osi_layer: OsiLayer.NOT_APPLICABLE,
    severity: Severity.HIGH,
    category: FindingCategory.RESUM
  },
  RESUM_TICKET_RESUMPTION_UNSUPPORTED: {
    name: "Ticket resumption not supported",
    description: "The server does not support session resumption through ticket encapsulation.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.RESUM
  },
  RESUM_TICKET_RESUMPTION_SUPPORTED: {
    name: "Ticket resumption supported",
    description: "The server supports session resumption through ticket encapsulation.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.RESUM
  },
  RESUM_SUCCEEDED: {
    name: "Session resumption succeeded",
    description: "At least one session resumption succeeded.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.RESUM
  },
  RESUM_FAILED: {
    name: "Session resumption failed",
    description: "At least one session resumption failed.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.RESUM
  },
  // ROBOT findings
  ROBOT_VULNERABLE: {
    name: "Vulnerable to ROBOT attack",
    description: 'The server is vulnerable to the "Return Of Bleichenbacher\'s Oracle Threat".',
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.HIGH,
    category: FindingCategory.ROBOT
  },
  ROBOT_PROBABLY_VULNERABLE: {
    name: "Probably vulnerable to ROBOT attack",
    description: 'The server may be vulnerable to the "Return Of Bleichenbacher\'s Oracle Threat". However, the results were inconsistent.',
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.MEDIUM,
    category: FindingCategory.ROBOT
  },
  // SSLv2 findings
  SSLV2_SUPPORTED: {
    name: "SSLv2 supported",
    description: "The server supports at least one cipher suite using the SSLv2 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.SSLV2
  },
  SSLV2_ERROR: {
    name: "SSLv2 negotation error",
    description: "At least one error occurred during negotiation using the SSLv2 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.SSLV2
  },
  // SSLv3 findings
  SSLV3_SUPPORTED: {
    name: "SSLv3 supported",
    description: "The server supports at least one cipher suite using the SSLv3 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.SSLV3
  },
  SSLV3_ERROR: {
    name: "SSLv3 negotation error",
    description: "At least one error occurred during negotiation using the SSLv3 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.SSLV3
  },
  // TLSv1 findings
  TLSV1_SUPPORTED: {
    name: "TLSv1 supported",
    description: "The server supports at least one cipher suite using the TLSv1 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.TLSV1
  },
  TLSV1_ERROR: {
    name: "TLSv1 negotation error",
    description: "At least one error occurred during negotiation using the TLSv1 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.TLSV1
  },
  // TLSv1.1 findings
  TLSV1_1_SUPPORTED: {
    name: "TLSv1.1 supported",
    description: "The server supports at least one cipher suite using the TLSv1.1 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.TLSV1_1
  },
  TLSV1_1_ERROR: {
    name: "TLSv1.1 negotation error",
    description: "At least one error occurred during negotiation using the TLSv1.1 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.TLSV1_1
  },
  // TLSv1.2 findings
  TLSV1_2_SUPPORTED: {
    name: "TLSv1.2 supported",
    description: "The server supports at least one cipher suite using the TLSv1.2 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.TLSV1_2
  },
  TLSV1_2_ERROR: {
    name: "TLSv1.2 negotation error",
    description: "At least one error occurred during negotiation using the TLSv1.2 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.TLSV1_2
  },
  // TLSv1.3 findings
  TLSV1_3_SUPPORTED: {
    name: "TLSv1.3 supported",
    description: "The server supports at least one cipher suite using the TLSv1.3 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.INFORMATIONAL,
    category: FindingCategory.TLSV1_3
  },
  TLSV1_3_ERROR: {
    name: "TLSv1.3 negotation error",
    description: "At least one error occurred during negotiation using the TLSv1.3 protocol.",
    osi_layer: OsiLayer.PRESENTATION,
    severity: Severity.LOW,
    category: FindingCategory.TLSV1_3
  }
});

const transformFunctions = [transformCertInfo, transformCompression, transformFallback, transformHeartbleed, transformCCS, transformReneg, transformResum, transformRobot, transformSSLv2, transformSSLv3, transformTLSv1, transformTLSv1_1, transformTLSv1_2, transformTLSv1_3];

let hostname = null;
let port = null;

async function parse(fileContent) {
  if (fileContent.accepted_targets == null || fileContent.accepted_targets.length == 0) {
    throw new Error("SSLyze result doesn't contain the expected result section. (No accepted_targets)");
  }

  const scanResult = fileContent.accepted_targets[0];
  hostname = scanResult.server_info.hostname;
  port = scanResult.server_info.port;

  let findings = [];
  for (const transformer of transformFunctions) {
    findings.push(...transformer(scanResult.commands_results));
  }
  return findings;
}
module.exports.parse = parse;

/**
 * Transforms SSLyze `certinfo` data
 */
function transformCertInfo({ certinfo }) {
  let findings = [];

  if (certinfo == null) {
    return findings;
  }

  if (certinfo.error_message != null) {
    // add error finding
    let f = Object.assign(
      {
        attributes: {
          error: certinfo.error_message
        }
      },
      FindingPrototypes.CERTINFO_ERROR
    );

    f.description = sprintf(f.description, certinfo.error_message);

    findings.push(buildFinding(f));
  } else {
    // add ordinary findings

    // check for untrusted certificates
    if (certinfo.path_validation_result_list != null) {
      for (const path_validation_result of certinfo.path_validation_result_list) {
        if (path_validation_result.verify_string === "ok") {
          continue;
        }

        let f = Object.assign(
          {
            attributes: {
              error: path_validation_result.verify_string,
              trust_store: `${path_validation_result.trust_store.name} (${path_validation_result.trust_store.path})`
            }
          },
          FindingPrototypes.CERTINFO_CERTIFICATE_NOT_TRUSTED
        );

        f.description = sprintf(f.description, path_validation_result.trust_store.name, path_validation_result.verify_string);

        findings.push(buildFinding(f));
      }
    }

    // check for Must-Staple extension
    if (!certinfo.leaf_certificate_has_must_staple_extension) {
      let f = Object.assign({}, FindingPrototypes.CERTINFO_MUST_STAPLE_UNSUPPORTED);
      findings.push(buildFinding(f));
    }

    // check for SCTS count
    if (certinfo.leaf_certificate_signed_certificate_timestamps_count != null && certinfo.leaf_certificate_signed_certificate_timestamps_count != 0) {
      let f = Object.assign(
        {
          attributes: {
            scts_count: certinfo.leaf_certificate_signed_certificate_timestamps_count
          }
        },
        FindingPrototypes.CERTINFO_INCLUDES_SCTS_COUNT
      );

      f.description = sprintf(f.description, certinfo.leaf_certificate_signed_certificate_timestamps_count);

      findings.push(buildFinding(f));
    }

    // check for anchor in certificate chain
    if (certinfo.received_chain_contains_anchor_certificate) {
      let f = Object.assign({}, FindingPrototypes.CERTINFO_ANCHOR_IN_CERTIFICATE_CHAIN);
      findings.push(buildFinding(f));
    }

    // check for SHA1 in certificate chain
    if (certinfo.verified_chain_has_sha1_signature) {
      let f = Object.assign({}, FindingPrototypes.CERTINFO_SHA1_IN_CERTIFICATE_CHAIN);
      findings.push(buildFinding(f));
    }

    // check for valid certificate chain order
    if (!certinfo.received_chain_has_valid_order) {
      let f = Object.assign({}, FindingPrototypes.CERTINFO_CHAIN_ORDER_INVALID);
      findings.push(buildFinding(f));
    }

    // check if certificate is verified as 'extended validation'
    if (!certinfo.leaf_certificate_is_ev) {
      let f = Object.assign({}, FindingPrototypes.CERTINFO_NOT_EV);
      findings.push(buildFinding(f));
    }

    // check if an OCSP response was received
    if (certinfo.ocsp_response == null) {
      let f = Object.assign({}, FindingPrototypes.CERTINFO_NO_OCSP_RESPONSE);
      findings.push(buildFinding(f));
    } else {
      // check if OCSP response is trusted
      if (!certinfo.ocsp_response_is_trusted) {
        let f = Object.assign({}, FindingPrototypes.CERTINFO_OCSP_RESPONSE_IS_NOT_TRUSTED);
        findings.push(buildFinding(f));
      }
    }

    // check if a path validation error occurred
    if (certinfo.path_validation_error_list != null) {
      for (const path_validation_error of certinfo.path_validation_error_list) {
        let f = Object.assign(
          {
            attributes: {
              error: path_validation_error.error_message
            }
          },
          FindingPrototypes.CERTINFO_HAS_PATH_VALIDATION_ERROR
        );

        f.description = sprintf(f.description, path_validation_error.error_message);

        findings.push(buildFinding(f));
      }
    }

    // check if certificate will be distrusted
    if (certinfo.verified_chain_has_legacy_symantec_anchor == true) {
      let f = Object.assign({}, FindingPrototypes.CERTINFO_WILL_BE_DISTRUSTED);

      f.description = sprintf(f.description, certinfo.symantec_distrust_timeline);

      findings.push(buildFinding(f));
    }
  }

  return findings;
}

/**
 * Transforms SSLyze `compression` data
 */
function transformCompression({ compression }) {
  let findings = [];

  if (compression == null) {
    return findings;
  }

  // check for exposed compression
  if (compression.compression_name != null) {
    let f = Object.assign(
      {
        attributes: {
          name: compression.compression_name
        }
      },
      FindingPrototypes.COMPRESSION_METHOD_EXPOSED
    );

    f.description = sprintf(f.description, compression.compression_name);

    findings.push(buildFinding(f));
  }

  return findings;
}

/**
 * Transforms SSLyze `fallback` data
 */
function transformFallback({ fallback }) {
  let findings = [];

  if (fallback == null) {
    return findings;
  }

  // check for SCSV fallback support
  if (!fallback.supports_fallback_scsv) {
    let f = Object.assign({}, FindingPrototypes.FALLBACK_NO_SCSV_SUPPORT);
    findings.push(buildFinding(f));
  }

  return findings;
}

/**
 * Transforms SSLyze `heartbleed` data
 */
function transformHeartbleed({ heartbleed }) {
  let findings = [];

  if (heartbleed == null) {
    return findings;
  }

  // check for Heartbleed vulnerability
  if (heartbleed.is_vulnerable_to_heartbleed) {
    let f = Object.assign({}, FindingPrototypes.HEARTBLEED_VULNERABLE);
    findings.push(buildFinding(f));
  }

  return findings;
}

/**
 * Transforms SSLyze `openssl_ccs` data
 */
function transformCCS({ ccs }) {
  let findings = [];

  if (ccs == null) {
    return findings;
  }

  // check for CCS vulnerability
  else if (ccs.is_vulnerable_to_ccs_injection) {
    let f = Object.assign({}, FindingPrototypes.CCS_VULNERABLE);
    findings.push(buildFinding(f));
  }

  return findings;
}

/**
 * Transforms SSLyze `reneg` data
 */
function transformReneg({ reneg }) {
  let findings = [];

  if (reneg == null) {
    return findings;
  }

  // check if server accepts client renegotiation
  if (reneg.accepts_client_renegotiation) {
    let f = Object.assign({}, FindingPrototypes.RENEG_ACCEPTED);
    findings.push(buildFinding(f));
  }

  // check if server supports secure renegotiation
  if (!reneg.supports_secure_renegotiation) {
    let f = Object.assign({}, FindingPrototypes.RENEG_NO_SECURE_SUPPORT);
    findings.push(buildFinding(f));
  }

  return findings;
}

/**
 * Transforms SSLyze `resum` data
 */
function transformResum({ resum }) {
  let findings = [];

  if (resum == null) {
    return findings;
  }

  if (resum.ticket_resumption_exception != null || resum.ticket_resumption_error != null) {
    // add error findings

    if (resum.ticket_resumption_exception != null) {
      let f = Object.assign(
        {
          attributes: {
            error: resum.ticket_resumption_exception
          }
        },
        FindingPrototypes.RESUM_ERROR
      );

      f.description = sprintf(f.description, resum.ticket_resumption_exception);

      findings.push(buildFinding(f));
    }

    if (resum.ticket_resumption_error != null) {
      let f = Object.assign(
        {
          attributes: {
            error: resum.ticket_resumption_error
          }
        },
        FindingPrototypes.RESUM_ERROR
      );

      f.description = sprintf(f.description, resum.ticket_resumption_error);

      findings.push(buildFinding(f));
    }
  } else {
    // add ordinary findings

    // check if ticket resumption supported
    if (resum.is_ticket_resumption_supported) {
      let f = Object.assign({}, FindingPrototypes.RESUM_TICKET_RESUMPTION_SUPPORTED);
      findings.push(buildFinding(f));
    } else {
      let f = Object.assign({}, FindingPrototypes.RESUM_TICKET_RESUMPTION_UNSUPPORTED);
      findings.push(buildFinding(f));
    }

    // check if there are successful session resumptions
    if (resum.successful_resumptions_nb > 0) {
      let f = Object.assign({}, FindingPrototypes.RESUM_SUCCEEDED);
      findings.push(buildFinding(f));
    }

    // check if there are failed session resumptions
    if (resum.failed_resumptions_nb > 0) {
      let f = Object.assign(
        {
          attributes: {
            error: resum.ticket_resumption_failed_reason
          }
        },
        FindingPrototypes.RESUM_FAILED
      );

      findings.push(buildFinding(f));
    }
  }

  return findings;
}

/**
 * Transforms SSLyze `robot` data
 */
function transformRobot({ robot }) {
  let findings = [];

  if (robot == null) {
    return findings;
  }

  // check for ROBOT vulnerability
  if ("VULNERABLE_WEAK_ORACLE" == robot.robot_result_enum || "VULNERABLE_STRONG_ORACLE" == robot.robot_result_enum) {
    let f = Object.assign({}, FindingPrototypes.ROBOT_VULNERABLE);
    findings.push(buildFinding(f));
  } else if ("UNKNOWN_INCONSISTENT_RESULTS" == robot.robot_result_enum) {
    let f = Object.assign({}, FindingPrototypes.ROBOT_PROBABLY_VULNERABLE);
    findings.push(buildFinding(f));
  }

  return findings;
}

/**
 * Transforms SSLyze `sslv2` data
 */
function transformSSLv2({ sslv2 }) {
  return transformProtocol(sslv2, FindingPrototypes.SSLV2_SUPPORTED, FindingPrototypes.SSLV2_ERROR);
}

/**
 * Transforms SSLyze `sslv3` data
 */
function transformSSLv3({ sslv3 }) {
  return transformProtocol(sslv3, FindingPrototypes.SSLV3_SUPPORTED, FindingPrototypes.SSLV3_ERROR);
}

/**
 * Transforms SSLyze `tlsv1` data
 */
function transformTLSv1({ tlsv1 }) {
  return transformProtocol(tlsv1, FindingPrototypes.TLSV1_SUPPORTED, FindingPrototypes.TLSV1_ERROR);
}

/**
 * Transforms SSLyze `tlsv1_1` data
 */
function transformTLSv1_1({ tlsv1_1 }) {
  return transformProtocol(tlsv1_1, FindingPrototypes.TLSV1_1_SUPPORTED, FindingPrototypes.TLSV1_1_ERROR);
}

/**
 * Transforms SSLyze `tlsv1_2` data
 */
function transformTLSv1_2({ tlsv1_2 }) {
  return transformProtocol(tlsv1_2, FindingPrototypes.TLSV1_2_SUPPORTED, FindingPrototypes.TLSV1_2_ERROR);
}

/**
 * Transforms SSLyze `tlsv1_3` data
 */
function transformTLSv1_3({ tlsv1_3 }) {
  return transformProtocol(tlsv1_3, FindingPrototypes.TLSV1_3_SUPPORTED, FindingPrototypes.TLSV1_3_ERROR);
}

/**
 * Transforms generic protocol data
 */
function transformProtocol(protocol, supportedFinding, errorFinding) {
  let findings = [];

  if (protocol == null) {
    return findings;
  }

  // check if this protocol is supported
  if (protocol.accepted_cipher_list != null && protocol.accepted_cipher_list.length > 0) {
    let f = Object.assign({}, supportedFinding);
    findings.push(buildFinding(f));
  }

  // check for errors
  if (protocol.errored_cipher_list != null) {
    for (const errored_cipher of protocol.errored_cipher_list) {
      let f = Object.assign(
        {
          attributes: {
            cipher: errored_cipher.name,
            error: errored_cipher.error_message
          }
        },
        errorFinding
      );
      findings.push(buildFinding(f));
    }
  }

  return findings;
}

/**
 * Builds a finding from the given data.
 * @param {*} f finding prototype
 */
function buildFinding(f) {
  return {
    name: f.name,
    description: f.description,
    osi_layer: f.osi_layer,
    reference: null,
    severity: f.severity,
    attributes: f.attributes || {},
    hint: null,
    category: f.category,
    location: `https://${hostname}:${port}`
  };
}
