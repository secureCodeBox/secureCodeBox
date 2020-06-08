const k8s = require('@kubernetes/client-node');

// configure k8s client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApiCRD = kc.makeApiClient(k8s.CustomObjectsApi);

async function handle({
  getFindings,
  attributeName = process.env["ATTRIBUTE_NAME"],
  attributeValue = process.env["ATTRIBUTE_VALUE"],
}) {
  
  const findings = await getFindings();

  console.log(findings);

  // const sslyzeYaml = k8s.dumpYaml(sslyzeJSONString);
  // const sslyzeYaml = k8s.loadYaml(sslyzeScanDefinition);

  console.log(`Found  #${findings.length} findings... trying to find possible subsequent security scans.`);

  for (const finding of findings) {
    if(finding.category == "Open Port") {
      console.log("Found open port finding for service: " + finding.attributes.port);

      if(finding.attributes.state = "open") {
      
        // search for HTTP ports and start subsequent Nikto Scan
        if(finding.attributes.service == "http" ) {
          console.log(" --> starting HTTP Service Scan: Nikto")

          startNiktoScan(finding.attributes.hostname, finding.attributes.port);
        }

        // search for HTTPS ports and start subsequent SSLyze Scan
        if(finding.attributes.service == "ssl" || finding.attributes.service == "https") {
          console.log(" --> starting HTTP(S) Service Scan: SSLyze")
          startSSLyzeScan(finding.attributes.hostname, finding.attributes.port);

          console.log(" --> starting HTTP(S) Service Scan: ZAP Baseline Scan")
          startZAPBaselineScan(finding.attributes.hostname, finding.attributes.port);
        }
        
        // search for HTTPS ports and start subsequent SSH Scan
        if(finding.attributes.service == "ssh" ) {
          console.log(" --> starting SSH Service Scan: SSH")

          startSSHScan(finding.attributes.hostname, finding.attributes.port);
        }
      }
    }
  }

  // const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

  // console.log("list namespaced Pods")
  // k8sApi.listNamespacedPod('default').then((res) => {
	//   console.log(res.body);
  // });

  // const k8sApiCRD = kc.makeApiClient(k8s.CustomObjectsApi);

  // // found at: https://github.com/kubernetes-client/javascript/issues/144
  // console.log("list namespaced CRDs")
  // k8sApiCRD.listNamespacedCustomObject(
  //   'execution.experimental.securecodebox.io',
  //   'v1',
  //   'default',
  //   'scans',
  //   'false'
  // ).then((res) => {
	//   console.log(res.body);
  // });
}

/**
 * Creates a new subsequent SCB ZAP Scan for the given hostname.
 * @param {*} hostname The hostname to start a new subsequent ZAP scan for.
 * @param {*} port The port to start a new subsequent ZAP scan for.
 */
function startZAPBaselineScan(hostname, port) {
  const zapScanDefinition = {
    apiVersion: "execution.experimental.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      "name": "zap-" + hostname.toLowerCase(),
      "labels": {
        "organization": "secureCodeBox"
      }
    },
    spec: {
      "scanType": "zap-baseline",
      "parameters": [
        "-t",
        "https://" + hostname + ":" + port
      ]
    }
  };

  // Starting another subsequent sslyze scan based on the nmap results
  // found at: https://github.com/kubernetes-client/javascript/blob/79736b9a608c18d818de61a6b44503a08ea3a78f/src/gen/api/customObjectsApi.ts#L209
  k8sApiCRD.createNamespacedCustomObject(
    'execution.experimental.securecodebox.io',
    'v1',
    'default',
    'scans',
    zapScanDefinition,
    'false'
  ).then((res) => {
    console.log(res.body);
  })
  .catch((e) => {
    console.log(e);
  });
}

/**
 * Creates a new subsequent SCB SSH Scan for the given hostname.
 * @param {*} hostname The hostname to start a new subsequent SSH scan for.
 * @param {*} port The port to start a new subsequent SSH scan for.
 */
function startSSHScan(hostname, port) {
  const sshScanDefintion = {
    "apiVersion": "execution.experimental.securecodebox.io/v1",
    "kind": "Scan",
    "metadata": {
      "name": "ssh-" + hostname.toLowerCase(),
      "labels": {
        "organization": "secureCodeBox"
      }
    },
    "spec": {
      "scanType": "ssh-scan",
      "parameters": [
        "-t",
        hostname
      ]
    }
  };

  // Starting another subsequent sslyze scan based on the nmap results
  // found at: https://github.com/kubernetes-client/javascript/blob/79736b9a608c18d818de61a6b44503a08ea3a78f/src/gen/api/customObjectsApi.ts#L209
  k8sApiCRD.createNamespacedCustomObject(
    'execution.experimental.securecodebox.io',
    'v1',
    'default',
    'scans',
    sshScanDefintion,
    'false'
  ).then((res) => {
    console.log(res.body);
  })
  .catch((e) => {
    console.log(e);
  });
}

/**
 * Creates a new subsequent SCB Nikto Scan for the given hostname.
 * @param {*} hostname The hostname to start a new subsequent Nikto scan for.
 * @param {*} port The port to start a new subsequent Nikto scan for.
 */
function startNiktoScan(hostname, port) {
  const niktoScanDefinition = {
    "apiVersion": "execution.experimental.securecodebox.io/v1",
    "kind": "Scan",
    "metadata": {
      "name": "nikto-" + hostname.toLowerCase(),
      "labels": {
        "organization": "secureCodeBox"
      }
    },
    "spec": {
      "scanType": "nikto",
      "parameters": [
        "-h",
        "https://" + hostname,
        "-Tuning",
        "1,2,3,5,7,b"
      ]
    }
  };

  // Starting another subsequent sslyze scan based on the nmap results
  // found at: https://github.com/kubernetes-client/javascript/blob/79736b9a608c18d818de61a6b44503a08ea3a78f/src/gen/api/customObjectsApi.ts#L209
  k8sApiCRD.createNamespacedCustomObject(
    'execution.experimental.securecodebox.io',
    'v1',
    'default',
    'scans',
    niktoScanDefinition,
    'false'
  ).then((res) => {
    console.log(res.body);
  })
  .catch((e) => {
    console.log(e);
  });
}

/**
 * Creates a new subsequent SCB SSLyze Scan for the given hostname.
 * @param {*} hostname The hostname to start a new subsequent SSLyze scan for.
 * @param {*} port The port to start a new subsequent SSLyze scan for.
 */
function startSSLyzeScan(hostname, port) {
  const sslyzeScanDefinition = {
    apiVersion: 'execution.experimental.securecodebox.io/v1',
    kind: 'Scan',
    metadata: {
      "name": "sslyze-" + hostname.toLowerCase(),
      "labels": {
        "organization": "secureCodeBox"
      }
    },
    "spec": {
      "scanType": "sslyze",
      "parameters": [
        "--regular",
        hostname
      ]
    }
  };

  // Starting another subsequent sslyze scan based on the nmap results
  // found at: https://github.com/kubernetes-client/javascript/blob/79736b9a608c18d818de61a6b44503a08ea3a78f/src/gen/api/customObjectsApi.ts#L209
  k8sApiCRD.createNamespacedCustomObject(
    'execution.experimental.securecodebox.io',
    'v1',
    'default',
    'scans',
    sslyzeScanDefinition,
    'false'
    ).then((res) => {
      console.log(res.body);
    })
    .catch((e) => {
      console.log(e);
    });
}

module.exports.handle = handle;
