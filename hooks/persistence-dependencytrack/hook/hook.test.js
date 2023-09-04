// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { handle } = require("./hook");
const fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ token: "statustoken" }) }));

beforeEach(() => {
  jest.clearAllMocks();
});

test("should not send a post request if not an SBOM scan", async () => {
  const result = {};

  const getRawResults = async () => result;

  const scan = {
    metadata: {
      uid: "25ea7ba4-48cf-45e4-ae5c-be1de83df9b8",
      name: "demo-trivy",
    },
    status: {
      rawResultType: "trivy-json"
    }
  };

  const apiKey = "verysecretgitleaksplsignore"
  const baseUrl = "http://example.com/foo/bar";

  await handle({ getRawResults, scan, apiKey, baseUrl, fetch });

  expect(fetch).toBeCalledTimes(0);
});

test("should not send a post request if not a CycloneDX SBOM", async () => {
  const result = {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: "bkimminich/juice-shop:v15.0.0",
    documentNamespace: "https://anchore.com/syft/image/bkimminich/juice-shop-v15.0.0-f25938fd-9d66-4dc6-a4c6-b0390b4cf037",
    creationInfo: {
      licenseListVersion: "3.21",
      creators: [
        "Organization: Anchore, Inc",
        "Tool: syft-0.85.0",
      ],
      created: "2023-08-02T11:42:48Z",
    }
  };

  const getRawResults = async () => result;

  // technically we're saying here that this scan is a CycloneDX scan even though we're then sending something looking like an SPDX SBOM
  const scan = {
    metadata: {
      uid: "c79e135e-3624-47dc-92d1-2ae6e7355a44",
      name: "demo-sbom",
    },
    status: {
      rawResultType: "sbom-cyclonedx"
    }
  };

  const apiKey = "verysecretgitleaksplsignore"
  const baseUrl = "http://example.com/foo/bar";

  await handle({ getRawResults, scan, apiKey, baseUrl, fetch });

  expect(fetch).toBeCalledTimes(0);
});

test("should send a post request to the url when fired", async () => {
  const result = {
    bomFormat: "CycloneDX",
    metadata: {
      component: {
        name: "hello-world:latest"
      }
    }
  };

  const getRawResults = async () => result;

  const scan = {
    metadata: {
      uid: "69e71358-bb01-425b-9bde-e45653605490",
      name: "demo-sbom",
    },
    status: {
      rawResultType: "sbom-cyclonedx"
    }
  };

  const apiKey = "verysecretgitleaksplsignore"
  const baseUrl = "http://example.com/foo/bar";
  const url = baseUrl + "/api/v1/bom"

  await handle({ getRawResults, scan, apiKey, baseUrl, fetch });

  expect(fetch).toBeCalledTimes(1);
  expect(fetch).toBeCalledWith(url, expect.objectContaining({
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
    },
  }));

  expect(fetch.mock.calls[0][1].body.get("bom")).toBe(JSON.stringify(result));
});
