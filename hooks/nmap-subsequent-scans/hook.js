const k8s = require('@kubernetes/client-node');

// configure k8s client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApiCRD = kc.makeApiClient(k8s.CustomObjectsApi);

async function handle({
  getFindings
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
          startNiktoScan(finding.attributes.hostname, finding.attributes.port);
        }

        // search for HTTPS ports and start subsequent SSLyze Scan
        if(finding.attributes.service == "ssl" || finding.attributes.service == "https") {
          startSSLyzeScan(finding.attributes.hostname, finding.attributes.port);

          startZAPBaselineScan(finding.attributes.hostname, finding.attributes.port);
        }
        
        // search for HTTPS ports and start subsequent SSH Scan
        if(finding.attributes.service == "ssh" ) {
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
  console.log(" --> starting subsequent ZAP Scan for host: " + hostname + ":" + port);

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
  console.log(" --> starting subsequent SSH Scan for host: " + hostname + ":" + port);

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
  console.log(" --> starting subsequent Nikto Scan for host: " + hostname + ":" + port);

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
  console.log(" --> starting subsequent SSLyze Scan for host: " + hostname + ":" + port);

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
