const axios = require('axios');
const { parse } = require('./parser/parser');
const uuid = require('uuid/v4');
const k8s = require('@kubernetes/client-node');

function severityCount(findings, severity) {
  return findings.filter(
    ({ severity: findingSeverity }) =>
      findingSeverity.toUpperCase() === severity
  ).length;
}

async function updateScanStatus(findings) {
  const kc = new k8s.KubeConfig();
  kc.loadFromCluster();
  const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);
  const scanName = process.env['SCAN_NAME'];
  const namespace = process.env['NAMESPACE'];

  try {
    const findingCategories = new Map();
    for (const { category } of findings) {
      if (findingCategories.has(category)) {
        findingCategories.set(category, findingCategories.get(category) + 1);
      } else {
        findingCategories.set(category, 1);
      }
    }

    await k8sApi.patchNamespacedCustomObjectStatus(
      'execution.experimental.securecodebox.io',
      'v1',
      namespace,
      'scans',
      scanName,
      {
        status: {
          findingCount: findings.length,
          findingSeverities: {
            informationalCount: severityCount(findings, 'INFORMATIONAL'),
            lowCount: severityCount(findings, 'LOW'),
            mediumCount: severityCount(findings, 'MEDIUM'),
            highCount: severityCount(findings, 'HIGH'),
          },
          findingCategories: Object.fromEntries(findingCategories.entries()),
        },
      },
      { headers: { 'content-type': 'application/merge-patch+json' } }
    );
    console.log('Updated status successfully');
    // console.log(res);
  } catch (err) {
    console.error('Failed to update Scan Status via the kubernetes api');
    console.error(err);
    process.exit(1);
  }
}

async function main() {
  const resultFileUrl = process.argv[2];
  const resultUploadUrl = process.argv[3];

  const { data } = await axios.get(resultFileUrl);

  const findings = await parse(data);
  console.log(`Transformed raw result file into ${findings.length} findings`);

  console.log('Adding UUIDs to the findings');
  const findingsWithIds = findings.map(finding => {
    return {
      ...finding,
      id: uuid(),
    };
  });

  await updateScanStatus(findings);

  console.log(`Uploading results to the file storage service`);

  await axios.put(resultUploadUrl, findingsWithIds);

  console.log(`Completed parser`);
}

main();
