// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require('./helpers'); // Update with the actual path

describe('Kubernetes interaction tests', () => {
  const mockK8sCRDApi = {
    createNamespacedCustomObject: jest.fn(),
    getNamespacedCustomObjectStatus: jest.fn(),
    deleteNamespacedCustomObject: jest.fn(),
    listNamespacedCustomObject: jest.fn()
  };

  // Mock responses
  const mockScanCreationResponse = {
    body: {
      apiVersion: "execution.securecodebox.io/v1",
      kind: "Scan",
      metadata: {
        creationTimestamp: "2024-01-16T14:40:59Z",
        generateName: "typo3scan-old-typo3-",
        generation: 1,
        managedFields: [
          {
            apiVersion: "execution.securecodebox.io/v1",
            fieldsType: "FieldsV1",
            fieldsV1: {
              "f:metadata": {
                "f:generateName": {},
              },
              "f:spec": {
                ".": {},
                "f:initContainers": {},
                "f:parameters": {},
                "f:resourceMode": {},
                "f:scanType": {},
                "f:volumeMounts": {},
                "f:volumes": {},
              },
            },
            manager: "unknown",
            operation: "Update",
            time: "2024-01-16T14:40:59Z",
          },
        ],
        name: "typo3scan-old-typo3-pw8vt",
        namespace: "integration-tests",
        resourceVersion: "1867",
        uid: "4ebccf10-ac84-4e85-91bc-1e4d60b45697",
      },
      spec: {
        initContainers: [],
        parameters: [
          "-d",
          "http://old-typo3.demo-targets.svc",
          "--vuln",
        ],
        resourceMode: "namespaceLocal",
        scanType: "typo3scan",
        volumeMounts: [],
        volumes: [],
      },
    }
  }
  const mockScanStatusResponse = {
    body: {
      apiVersion: "execution.securecodebox.io/v1",
      kind: "Scan",
      metadata: {
        creationTimestamp: "2024-01-16T14:45:28Z",
        finalizers: [
          "s3.storage.securecodebox.io",
        ],
        generateName: "typo3scan-old-typo3-",
        generation: 2,
        managedFields: [
          {
            apiVersion: "execution.securecodebox.io/v1",
            fieldsType: "FieldsV1",
            fieldsV1: {
              "f:metadata": {
                "f:finalizers": {
                  ".": {},
                  "v:\"s3.storage.securecodebox.io\"": {},
                },
              },
              "f:spec": {
                "f:resources": {},
              },
            },
            manager: "manager",
            operation: "Update",
            time: "2024-01-16T14:45:28Z",
          },
          {
            apiVersion: "execution.securecodebox.io/v1",
            fieldsType: "FieldsV1",
            fieldsV1: {
              "f:status": {
                ".": {},
                "f:findingDownloadLink": {},
                "f:findingHeadLink": {},
                "f:findings": {
                  ".": {},
                  "f:severities": {},
                },
                "f:rawResultDownloadLink": {},
                "f:rawResultFile": {},
                "f:rawResultHeadLink": {},
                "f:rawResultType": {},
                "f:state": {},
              },
            },
            manager: "manager",
            operation: "Update",
            subresource: "status",
            time: "2024-01-16T14:45:28Z",
          },
          {
            apiVersion: "execution.securecodebox.io/v1",
            fieldsType: "FieldsV1",
            fieldsV1: {
              "f:metadata": {
                "f:generateName": {},
              },
              "f:spec": {
                ".": {},
                "f:parameters": {},
                "f:resourceMode": {},
                "f:scanType": {},
              },
            },
            manager: "unknown",
            operation: "Update",
            time: "2024-01-16T14:45:28Z",
          },
        ],
        name: "typo3scan-old-typo3-c24gt",
        namespace: "integration-tests",
        resourceVersion: "2399",
        uid: "5d2ef0e2-ad11-4e58-80d0-5168a137da17",
      },
      spec: {
        parameters: [
          "-d",
          "http://old-typo3.demo-targets.svc",
          "--vuln",
        ],
        resourceMode: "namespaceLocal",
        resources: {},
        scanType: "typo3scan",
      },
      status: {
        findingDownloadLink: "http://securecodebox-operator-minio.securecodebox-system.svc.cluster.local:9000/securecodebox/scan-c4c2b6ae-f8a1-474d-88ec-c739f6e55f56/findings.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=admin%2F20240116%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240116T160849Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=5944f10813f6127d96a3889b06c8256765c3a739db1e23f650ee6ec9ed956b20",
        findingHeadLink: "http://securecodebox-operator-minio.securecodebox-system.svc.cluster.local:9000/securecodebox/scan-c4c2b6ae-f8a1-474d-88ec-c739f6e55f56/findings.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=admin%2F20240116%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240116T160849Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=45833109b8ea8d43df51b535730aece4cec1dbf6557a12acd1b95cdbce1f221e",
        findings: {
          categories: {
            Vulnerability: 24,
          },
          count: 24,
          severities: {
            high: 24,
          },
        },
        rawResultDownloadLink: "http://securecodebox-operator-minio.securecodebox-system.svc.cluster.local:9000/securecodebox/scan-c4c2b6ae-f8a1-474d-88ec-c739f6e55f56/typo3scan.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=admin%2F20240116%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240116T160849Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=0a91e1756a42fa40ca9bf1bb448ec36c544dd5af4b76c8bc3e91debbb68e349e",
        rawResultFile: "typo3scan.json",
        rawResultHeadLink: "http://securecodebox-operator-minio.securecodebox-system.svc.cluster.local:9000/securecodebox/scan-c4c2b6ae-f8a1-474d-88ec-c739f6e55f56/typo3scan.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=admin%2F20240116%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240116T160849Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=d09a78fe0e563ac70a75c908319085699894a9eca04d4a32d723862e748e9416",
        rawResultType: "typo3scan-json",
        state: "Done",
      },
    }
  };


  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scan function', () => {
    it('should create a scan and return findings on successful completion', async () => {
      // Setup mock responses
      mockK8sCRDApi.createNamespacedCustomObject.mockResolvedValue(mockScanCreationResponse);
      mockK8sCRDApi.getNamespacedCustomObjectStatus.mockResolvedValue(mockScanStatusResponse);

      const findings = await scan('typo3scan-old-typo3', 'typo3scan', [], 180, [], [], [], mockK8sCRDApi);

      // Assertions
      expect(findings).toBeDefined();
      expect(findings.count).toBe(24);
      expect(findings.categories).toStrictEqual({"Vulnerability": 24});
      expect(findings.severities).toStrictEqual({"high": 24,});
      expect(mockK8sCRDApi.createNamespacedCustomObject).toHaveBeenCalledWith("execution.securecodebox.io", "v1", "integration-tests", "scans", { "apiVersion": "execution.securecodebox.io/v1", "kind": "Scan", "metadata": { "generateName": "typo3scan-old-typo3-" }, "spec": { "initContainers": [], "parameters": [], "scanType": "typo3scan", "volumeMounts": [], "volumes": [] } });
      expect(mockK8sCRDApi.getNamespacedCustomObjectStatus).toHaveBeenCalledWith("execution.securecodebox.io", "v1", "integration-tests", "scans", "typo3scan-old-typo3-pw8vt");
    });
  });
});
