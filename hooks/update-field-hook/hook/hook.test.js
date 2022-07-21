// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { handle } = require("./hook");

test("should send a post request to the url when fired", async () => {
  const findings = [
    {
      name: "Open Port",
      attributes: {
        hostname: "foobar.com",
      },
    },
  ];

  const getFindings = async () => findings;

  const updateFindings = jest.fn();

  await handle({
    getFindings,
    updateFindings,
    attributeName: "attributes.cluster",
    attributeValue: "gke-internal",
  });

  expect(updateFindings).toBeCalledWith([
    {
      name: "Open Port",
      attributes: {
        hostname: "foobar.com",
        cluster: "gke-internal",
      },
    },
  ]);
});
