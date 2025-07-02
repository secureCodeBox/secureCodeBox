// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan, cascadingScan } = require("./helpers");

jest.setTimeout(10 * 1000);

describe("Kubernetes interaction tests", () => {
  const mockK8sCRDApi = {
    createNamespacedCustomObject: jest.fn(),
    getNamespacedCustomObjectStatus: jest.fn(),
    deleteNamespacedCustomObject: jest.fn(),
    listNamespacedCustomObject: jest.fn(),
  };
  const mockK8sBatchApi = {
    createNamespacedJob: jest.fn(),
    deleteNamespacedJob: jest.fn(),
    listNamespacedJob: jest.fn(),
  };

  const mockPodsApi = {
    listNamespacedPod: jest.fn(),
    readNamespacedPodLog: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("scan function", () => {
    it("should create a scan and return findings on successful completion", async () => {
      const mockScanCreationResponse = require("./__testFiles__/mockScanCreationResponse.json");
      const mockScanStatusResponse = require("./__testFiles__/mockScanStatusResponse.json");

      mockK8sCRDApi.createNamespacedCustomObject.mockResolvedValue(
        mockScanCreationResponse,
      );
      mockK8sCRDApi.getNamespacedCustomObjectStatus.mockResolvedValue(
        mockScanStatusResponse,
      );
      const k8sApi = {
        k8sCRDApi: mockK8sCRDApi,
        k8sBatchApi: mockK8sBatchApi,
        k8sPodsApi: mockPodsApi,
      };

      const findings = await scan(
        "nmap-example",
        "nmap",
        [],
        180,
        [],
        [],
        [],
        k8sApi,
      );

      expect(findings).toMatchInlineSnapshot(`
        {
          "categories": {
            "Vulnerability": 24,
          },
          "count": 24,
          "severities": {
            "high": 24,
          },
        }
      `);
      expect(mockK8sCRDApi.createNamespacedCustomObject.mock.calls)
        .toMatchInlineSnapshot(`
        [
          [
            {
              "body": {
                "apiVersion": "execution.securecodebox.io/v1",
                "kind": "Scan",
                "metadata": {
                  "generateName": "nmap-example-",
                },
                "spec": {
                  "initContainers": [],
                  "parameters": [],
                  "scanType": "nmap",
                  "volumeMounts": [],
                  "volumes": [],
                },
              },
              "group": "execution.securecodebox.io",
              "namespace": "integration-tests",
              "plural": "scans",
              "version": "v1",
            },
          ],
        ]
      `);
      expect(mockK8sCRDApi.getNamespacedCustomObjectStatus.mock.calls)
        .toMatchInlineSnapshot(`
        [
          [
            {
              "group": "execution.securecodebox.io",
              "name": "nmap-example-pw8vt",
              "namespace": "integration-tests",
              "plural": "scans",
              "version": "v1",
            },
          ],
          [
            {
              "group": "execution.securecodebox.io",
              "name": "nmap-example-pw8vt",
              "namespace": "integration-tests",
              "plural": "scans",
              "version": "v1",
            },
          ],
        ]
      `);
    });

    it("should throw an error if the scan fails", async () => {
      const mockScanCreationResponse = require("./__testFiles__/mockScanCreationResponse.json");
      const mockScanStatusResponse_Errored = require("./__testFiles__/mockScanStatusResponse_Errored.json");

      const mockListNamespacedJobResponse = require("./__testFiles__/mockListNamespacedJobResponse.json");

      const mockListNamespacedPodResponse = require("./__testFiles__/mockListNamespacedPodResponse.json");
      const mockReadNamespacedPodLogResponse = require("./__testFiles__/mockReadNamespacedPodLogResponse.json");

      mockK8sCRDApi.createNamespacedCustomObject.mockResolvedValue(
        mockScanCreationResponse,
      );
      mockK8sCRDApi.getNamespacedCustomObjectStatus.mockResolvedValue(
        mockScanStatusResponse_Errored,
      );
      mockK8sBatchApi.listNamespacedJob.mockResolvedValue(
        mockListNamespacedJobResponse,
      );
      mockPodsApi.listNamespacedPod.mockResolvedValue(
        mockListNamespacedPodResponse,
      );
      mockPodsApi.readNamespacedPodLog.mockResolvedValue(
        mockReadNamespacedPodLogResponse,
      );

      const k8sApi = {
        k8sCRDApi: mockK8sCRDApi,
        k8sBatchApi: mockK8sBatchApi,
        k8sPodsApi: mockPodsApi,
      };

      return expect(
        scan("nmap-example", "nmap", [], 180, [], [], [], k8sApi),
      ).rejects.toThrow('Scan failed with description "Mocked Error"');
    });
  });

  describe("cascading scan function", () => {
    it("should create a cascading scan and return findings on successful completion", async () => {
      const mockScanCreationResponse = require("./__testFiles__/mockCascadingScanCreationResponse.json");
      const mockScanStatusResponse = require("./__testFiles__/mockCascadingScanStatusResponse.json");
      const mockListNamespacedCustomObjectResponse = require("./__testFiles__/mockCascadingListNamespacedCustomObject.json");

      mockK8sCRDApi.createNamespacedCustomObject.mockResolvedValue(
        mockScanCreationResponse,
      );
      mockK8sCRDApi.getNamespacedCustomObjectStatus.mockResolvedValue(
        mockScanStatusResponse,
      );

      mockK8sCRDApi.listNamespacedCustomObject.mockResolvedValue(
        mockListNamespacedCustomObjectResponse,
      );

      const k8sApi = {
        k8sCRDApi: mockK8sCRDApi,
        k8sBatchApi: mockK8sBatchApi,
        k8sPodsApi: mockPodsApi,
      };

      const findings = await cascadingScan(
        "nmap-dummy-ssh",
        "nmap",
        ["-Pn", "-sV", "dummy-ssh.demo-targets.svc"],
        {
          nameCascade: "ncrack-ssh",
          matchLabels: {
            "securecodebox.io/invasive": "invasive",
            "securecodebox.io/intensive": "high",
          },
        },
        180,
        k8sApi,
      );

      expect(findings).toMatchInlineSnapshot(`
        {
          "categories": {
            "Discovered Credentials": 1,
          },
          "count": 1,
          "severities": {
            "high": 1,
          },
        }
      `);
    });

    it("should throw an error if the scan fails", async () => {
      const mockScanCreationResponse = require("./__testFiles__/mockCascadingScanCreationResponse.json");
      const mockScanStatusResponse_Errored = require("./__testFiles__/mockCascadingScanStatusResponse_Errored.json");

      const mockListNamespacedJobResponse = require("./__testFiles__/mockListNamespacedJobResponse.json");

      const mockListNamespacedPodResponse = require("./__testFiles__/mockListNamespacedPodResponse.json");
      const mockReadNamespacedPodLogResponse = require("./__testFiles__/mockReadNamespacedPodLogResponse.json");

      mockK8sCRDApi.createNamespacedCustomObject.mockResolvedValue(
        mockScanCreationResponse,
      );
      mockK8sCRDApi.getNamespacedCustomObjectStatus.mockResolvedValue(
        mockScanStatusResponse_Errored,
      );
      mockK8sBatchApi.listNamespacedJob.mockResolvedValue(
        mockListNamespacedJobResponse,
      );
      mockPodsApi.listNamespacedPod.mockResolvedValue(
        mockListNamespacedPodResponse,
      );
      mockPodsApi.readNamespacedPodLog.mockResolvedValue(
        mockReadNamespacedPodLogResponse,
      );
      const k8sApi = {
        k8sCRDApi: mockK8sCRDApi,
        k8sBatchApi: mockK8sBatchApi,
        k8sPodsApi: mockPodsApi,
      };

      return expect(
        cascadingScan(
          "nmap-dummy-ssh",
          "nmap",
          ["-Pn", "-sV", "dummy-ssh.demo-targets.svc"],
          {
            nameCascade: "ncrack-ssh",
            matchLabels: {
              "securecodebox.io/invasive": "invasive",
              "securecodebox.io/intensive": "high",
            },
          },
          180,
          k8sApi,
        ),
      ).rejects.toThrow('Initial Scan failed with description "Mocked Error"');
    });
  });
});
