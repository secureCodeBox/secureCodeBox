const { startSubsequentSecureCodeBoxScan } = require("./scan-helpers");

async function handle({ 
  scan, 
  getFindings,
  cascadeAmassNmap        = process.env["CASCADE_AMASS_NMAP"] === "true",
  cascadeNmapSsl          = process.env["CASCADE_NMAP_SSL"] === "true",
  cascadeNmapSsh          = process.env["CASCADE_NMAP_SSH"] === "true",
  cascadeNmapNikto        = process.env["CASCADE_NMAP_NIKTO"] === "true",
  cascadeNmapSmb          = process.env["CASCADE_NMAP_SMB"] === "true",
  cascadeNmapZapBaseline  = process.env["CASCADE_NMAP_ZAP_BASELINE"] === "true",
}) {
  const findings = await getFindings();

  console.log(findings);
  console.log("cascadeAmassNmap: " + cascadeAmassNmap);
  console.log("cascadeNmapSsl: " + cascadeNmapSsl);
  console.log("cascadeNmapSsh: " + cascadeNmapSsh);
  console.log("cascadeNmapNikto: " + cascadeNmapNikto);
  console.log("cascadeNmapSmb: " + cascadeNmapSmb);
  console.log("cascadeNmapZapBaseline: " + cascadeNmapZapBaseline);

  console.log(
    `Found #${findings.length} findings... Trying to find identify if these are NMAP specific findings and start possible subsequent security scans.`
  );

  for (const finding of findings) {
    if (
      finding.category === "Open Port" &&
      finding.attributes.state === "open" &&
      (finding.attributes.hostname != null || finding.attributes.ip_address)
    ) {
      
      const hostname = finding.attributes.hostname || finding.attributes.ip_address;
      const port = finding.attributes.port;

      console.log(
        "Found NMAP 'Open Port' finding for host '"+hostname+"' port: '" + finding.attributes.port+"' and service: '" + finding.attributes.service + "'"
      );

      // search for HTTP ports and start subsequent Nikto Scan
      if (
        cascadeNmapNikto && 
        finding.attributes.service === "http"
      ) {
        await startNiktoHttpScan({
          parentScan: scan,
          hostname,
          port,
        });
      }

      // search for SMB ports and start subsequent NMAP Scan
      if (
        cascadeNmapSmb && 
        finding.attributes.port === 445 && 
        finding.attributes.service === "microsoft-ds"
      ) {
        await startSMBScan({
          parentScan: scan,
          hostname,
          port,
        });
      }

      // search for HTTPS ports and start subsequent SSLyze Scan
      if (
        cascadeNmapSsl && 
        (finding.attributes.service === "ssl" ||
        finding.attributes.service === "https")
      ) {
        await startSSLyzeScan({
          parentScan: scan,
          hostname,
          port,
        });
      }

      // search for HTTPS ports and start subsequent ZAP Baselne Scan
      if (
        cascadeNmapZapBaseline && 
        (finding.attributes.service === "ssl" ||
        finding.attributes.service === "https")
      ) {
        await startZAPBaselineHttpsScan({
          parentScan: scan,
          hostname,
          port,
        });
      }

      // search for HTTPS ports and start subsequent SSH Scan
      if (
        cascadeNmapSsh &&
        finding.attributes.service === "ssh"
      ) {
        await startSSHScan({
          parentScan: scan,
          hostname,
          port,
        });
      }
    }
  }

  console.log(
    `Found  #${findings.length} findings... Trying to find identify if these are AMASS specific findings and start possible subsequent security scans.`
  );

  for (const finding of findings) {
    if(
      cascadeAmassNmap &&
      finding.category === "Subdomain" && 
      finding.osi_layer === "NETWORK" && 
      finding.description.startsWith("Found subdomain"
    )) {
      console.log("Found AMASS 'Subdomain' finding: " + finding.location);

      const hostname = finding.location;
      
      await startNMAPScan({
        parentScan: scan,
        hostname
      });
    }
  }
}

/**
 * Creates a new subsequent SCB ZAP Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent ZAP scan for.
 * @param {string} port The port to start a new subsequent ZAP scan for.
 */
async function startSMBScan({ parentScan, hostname}) {
  if(hostname) {
    console.log(
      " --> Starting async subsequent NMAP SMB Scan for host: " + hostname
    );
    await startSubsequentSecureCodeBoxScan({
      parentScan,
      name: `nmap-smb-${hostname.toLowerCase()}`,
      scanType: "nmap",
      parameters: ["-Pn", "-p445", "--script", "smb-protocols", hostname],
    });
  }
  else
  {
    console.log(
      " --> Failed to start subsequent NMAP SMB Scan because host: '" + hostname + "' must not be null."
    );
  }
}

/**
 * Creates a new subsequent SCB ZAP Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent ZAP scan for.
 * @param {string} port The port to start a new subsequent ZAP scan for.
 */
async function startNMAPScan({ parentScan, hostname}) {
  

  if(hostname) {
    console.log(
      " --> Starting async subsequent NMAP Scan for host: " + hostname
    );
    await startSubsequentSecureCodeBoxScan({
      parentScan,
      name: `nmap-${hostname.toLowerCase()}`,
      scanType: "nmap",
      parameters: ["-Pn", hostname],
    });
  }
  else
  {
    console.log(
      " --> Failed to start subsequent NMAP Scan because host: '" + hostname + "' must not be null."
    );
  }
}

/**
 * Creates a new subsequent SCB ZAP Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent ZAP scan for.
 * @param {string} port The port to start a new subsequent ZAP scan for.
 */
async function startZAPBaselineHttpsScan({ parentScan, hostname, port }) {
  

  if(hostname) {
    console.log(
      " --> Starting async subsequent ZAP Scan for host: '" + hostname + "' and port: '" + port + "'"
    );
    await startSubsequentSecureCodeBoxScan({
      parentScan,
      name: `zap-https-${hostname.toLowerCase()}`,
      scanType: "zap-baseline",
      parameters: ["-t", "https://" + hostname + ":" + port],
    });
  }
  else
  {
    console.log(
      " --> Failed to start subsequent ZAP Scan because host: '" + hostname + "' and port: '" + port + "' must not be null."
    );
  }
}

/**
 * Creates a new subsequent SCB SSH Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent SSH scan for.
 * @param {string} port The port to start a new subsequent SSH scan for.
 */
async function startSSHScan({ parentScan, hostname, port }) {
  
  if(hostname && port) {
    console.log(
      " --> Starting async subsequent SSH Scan for host: '" + hostname + "' and port: '" + port + "'"
    );
    await startSubsequentSecureCodeBoxScan({
      parentScan,
      name: `ssh-${hostname.toLowerCase()}`,
      scanType: "ssh-scan",
      parameters: ["-t", hostname, "-p", port.toString()],
    });
  }
  else
  {
    console.log(
      " --> Failed to start subsequent SSH Scan because host: '" + hostname + "' and port: '" + port + "' must not be null."
    );
  }
}

/**
 * Creates a new subsequent SCB Nikto Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent Nikto scan for.
 * @param {string} port The port to start a new subsequent Nikto scan for.
 */
async function startNiktoHttpScan({ parentScan, hostname, port }) {
 

  if(hostname && port) {
    console.log(
      " --> Starting async subsequent Nikto Scan for host: '" + hostname + "' and port: '" + port + "'"
    );
    await startSubsequentSecureCodeBoxScan({
      parentScan,
      name: `nikto-http-${hostname.toLowerCase()}`,
      scanType: "nikto",
      parameters: ["-h", "http://" + hostname, "-p", port.toString(), "-Tuning", "1,2,3,5,7,b"],
    });
  }
  else
  {
    console.log(
      " --> Failed to start subsequent Nikto Scan because host: '" + hostname + "' and port: '" + port + "' must not be null."
    );
  }
}

/**
 * Creates a new subsequent SCB SSLyze Scan for the given hostname.
 * @param {string} hostname The hostname to start a new subsequent SSLyze scan for.
 * @param {string} port The port to start a new subsequent SSLyze scan for.
 */
async function startSSLyzeScan({ parentScan, hostname, port }) {
  

  if(hostname && port) {
    console.log(
      " --> Starting async subsequent SSLyze Scan for host: '" + hostname + "' and port: '" + port + "'"
    );
    await startSubsequentSecureCodeBoxScan({
      parentScan,
      name: `sslyze-${hostname.toLowerCase()}`,
      scanType: "sslyze",
      parameters: ["--regular", hostname+":"+port],
    });
  }
  else
  {
    console.log(
      " --> Failed to start subsequent SSLyze Scan because host: '" + hostname + "' and port: '" + port + "' must not be null."
    );
  }
}

module.exports.handle = handle;
