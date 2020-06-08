const { startSubsequentSecureCodeBoxScan } = require("./scan-helpers");

async function handle({ scan, getFindings }) {
  const findings = await getFindings();

  console.log(findings);

  console.log(
    `Found #${findings.length} findings... trying to find possible subsequent security scans.`
  );

  for (const finding of findings) {
    if (
      finding.category === "Open Port" &&
      finding.attributes.state === "open"
    ) {
      const hostname = finding.attributes.hostname;
      const port = finding.attributes.port;

      console.log(
        "Found open port finding for service: " + finding.attributes.port
      );

      // search for HTTP ports and start subsequent Nikto Scan
      if (finding.attributes.service === "http") {
        await startNiktoScan({
          parentScan: scan,
          hostname,
          port,
        });
      }

      // search for HTTPS ports and start subsequent SSLyze Scan
      if (
        finding.attributes.service === "ssl" ||
        finding.attributes.service === "https"
      ) {
        await startSSLyzeScan({
          parentScan: scan,
          hostname,
          port,
        });

        await startZAPBaselineScan({
          parentScan: scan,
          hostname,
          port,
        });
      }

      // search for HTTPS ports and start subsequent SSH Scan
      if (finding.attributes.service === "ssh") {
        await startSSHScan({
          parentScan: scan,
          hostname,
          port,
        });
      }
    }
  }
}

/**
 * Creates a new subsequent SCB ZAP Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent ZAP scan for.
 * @param {string} port The port to start a new subsequent ZAP scan for.
 */
async function startZAPBaselineScan({ parentScan, hostname, port }) {
  console.log(
    " --> Starting async subsequent ZAP Scan for host: " + hostname + ":" + port
  );

  await startSubsequentSecureCodeBoxScan({
    parentScan,
    name: `zap-${hostname.toLowerCase()}`,
    scanType: "zap-baseline",
    parameters: ["-t", "https://" + hostname + ":" + port],
  });
}

/**
 * Creates a new subsequent SCB SSH Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent SSH scan for.
 * @param {string} port The port to start a new subsequent SSH scan for.
 */
async function startSSHScan({ parentScan, hostname, port }) {
  console.log(
    " --> Starting async subsequent SSH Scan for host: " + hostname + ":" + port
  );

  await startSubsequentSecureCodeBoxScan({
    parentScan,
    name: `ssh-${hostname.toLowerCase()}`,
    scanType: "ssh-scan",
    parameters: ["-t", hostname],
  });
}

/**
 * Creates a new subsequent SCB Nikto Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent Nikto scan for.
 * @param {string} port The port to start a new subsequent Nikto scan for.
 */
async function startNiktoScan({ parentScan, hostname, port }) {
  console.log(
    " --> Starting async subsequent Nikto Scan for host: " + hostname + ":" + port
  );

  await startSubsequentSecureCodeBoxScan({
    parentScan,
    name: `nikto-${hostname.toLowerCase()}`,
    scanType: "nikto",
    parameters: ["-h", "https://" + hostname, "-Tuning", "1,2,3,5,7,b"],
  });
}

/**
 * Creates a new subsequent SCB SSLyze Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent SSLyze scan for.
 * @param {string} port The port to start a new subsequent SSLyze scan for.
 */
async function startSSLyzeScan({ parentScan, hostname, port }) {
  console.log(
    " --> Starting async subsequent SSLyze Scan for host: " + hostname + ":" + port
  );

  await startSubsequentSecureCodeBoxScan({
    parentScan,
    name: `sslyze-${hostname.toLowerCase()}`,
    scanType: "sslyze",
    parameters: ["--regular", hostname],
  });
}

module.exports.handle = handle;
