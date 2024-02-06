// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan, cascadingScan} = require("./helpers");

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
        mockScanCreationResponse
      );
      mockK8sCRDApi.getNamespacedCustomObjectStatus.mockResolvedValue(
        mockScanStatusResponse
      );
      const k8sApi = { k8sCRDApi:mockK8sCRDApi, k8sBatchApi:mockK8sBatchApi, k8sPodsApi:mockPodsApi }

      const findings = await scan(
        "typo3scan-old-typo3",
        "typo3scan",
        [],
        180,
        [],
        [],
        [],
        k8sApi
      );

      expect(findings).toBeDefined();
      expect(findings).toMatchSnapshot();
      expect(mockK8sCRDApi.createNamespacedCustomObject).toMatchSnapshot();
      expect(mockK8sCRDApi.getNamespacedCustomObjectStatus).toMatchSnapshot();
    });

    it("should throw an error if the scan fails", async () => {
      const mockScanCreationResponse = require("./__testFiles__/mockScanCreationResponse.json");
      const mockScanStatusResponse_Errored = require("./__testFiles__/mockScanStatusResponse_Errored.json");

      const mockListNamespacedJobResponse = require("./__testFiles__/mockListNamespacedJobResponse.json");

      const mockListNamespacedPodResponse = require("./__testFiles__/mockListNamespacedPodResponse.json");
      const mockReadNamespacedPodLogResponse = require("./__testFiles__/mockReadNamespacedPodLogResponse.json");

      mockK8sCRDApi.createNamespacedCustomObject.mockResolvedValue(
        mockScanCreationResponse
      );
      mockK8sCRDApi.getNamespacedCustomObjectStatus.mockResolvedValue(
        mockScanStatusResponse_Errored
      );
      mockK8sBatchApi.listNamespacedJob.mockResolvedValue(
        mockListNamespacedJobResponse
      );
      mockPodsApi.listNamespacedPod.mockResolvedValue(
        mockListNamespacedPodResponse
      );
      mockPodsApi.readNamespacedPodLog.mockResolvedValue(
        mockReadNamespacedPodLogResponse
      );


      const k8sApi = { k8sCRDApi:mockK8sCRDApi, k8sBatchApi:mockK8sBatchApi, k8sPodsApi:mockPodsApi }

      try {
        await scan(
          "typo3scan-old-typo3",
          "typo3scan",
          [],
          180,
          [],
          [],
          [],
          k8sApi
        );
      } catch (error) {
        expect(error).toMatchInlineSnapshot(
          `[Error: Scan failed with description "Mocked Error"]`
        );
      }
    });
  });

  describe("cascading scan function", () => {
    it("should create a cascading scan and return findings on successful completion", async () => {
      const mockScanCreationResponse = require("./__testFiles__/mockCascadingScanCreationResponse.json");
      const mockScanStatusResponse = require("./__testFiles__/mockCascadingScanStatusResponse.json");
      const mockListNamespacedCustomObjectResponse = require("./__testFiles__/mockCascadingListNamespacedCustomObject.json");

      mockK8sCRDApi.createNamespacedCustomObject.mockResolvedValue(
        mockScanCreationResponse
      );
      mockK8sCRDApi.getNamespacedCustomObjectStatus.mockResolvedValue(
        mockScanStatusResponse
      );

      mockK8sCRDApi.listNamespacedCustomObject.mockResolvedValue(
        mockListNamespacedCustomObjectResponse
      );

      const k8sApi = { k8sCRDApi:mockK8sCRDApi, k8sBatchApi:mockK8sBatchApi, k8sPodsApi:mockPodsApi }

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
        k8sApi
      );

      expect(findings).toBeDefined();
      expect(findings).toMatchSnapshot();
    });
    it("should throw an error if the scan fails", async () => {
      const mockScanCreationResponse = require("./__testFiles__/mockCascadingScanCreationResponse.json");
      const mockScanStatusResponse_Errored = require("./__testFiles__/mockCascadingScanStatusResponse_Errored.json");

      const mockListNamespacedJobResponse = require("./__testFiles__/mockListNamespacedJobResponse.json");

      const mockListNamespacedPodResponse = require("./__testFiles__/mockListNamespacedPodResponse.json");
      const mockReadNamespacedPodLogResponse = require("./__testFiles__/mockReadNamespacedPodLogResponse.json");

      mockK8sCRDApi.createNamespacedCustomObject.mockResolvedValue(
        mockScanCreationResponse
      );
      mockK8sCRDApi.getNamespacedCustomObjectStatus.mockResolvedValue(
        mockScanStatusResponse_Errored
      );
      mockK8sBatchApi.listNamespacedJob.mockResolvedValue(
        mockListNamespacedJobResponse
      );
      mockPodsApi.listNamespacedPod.mockResolvedValue(
        mockListNamespacedPodResponse
      );
      mockPodsApi.readNamespacedPodLog.mockResolvedValue(
        mockReadNamespacedPodLogResponse
      );
      const k8sApi = { k8sCRDApi:mockK8sCRDApi, k8sBatchApi:mockK8sBatchApi, k8sPodsApi:mockPodsApi }

      try {
        await cascadingScan(
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
          k8sApi
        );
      } catch (error) {
        expect(error).toMatchInlineSnapshot(
          `[Error: Initial Scan failed with description "Mocked Error"]`
        );
      }
    });
  });
});
