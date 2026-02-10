// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";
import { parse } from "./parser";

test("should properly parse subfinder json file without ip output", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/passive_scan_without_ip_example.com.jsonl",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse subfinder json file with ip output", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/active_scan_with_ip_example.com.jsonl",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty json file", async () => {
  const fileContent = await readFile(__dirname + "/__testFiles__/empty.jsonl", {
    encoding: "utf8",
  });
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty json file with includeTargetDomain=true", async () => {
  const scan = {
    spec: {
      scanType: "subfinder",
      parameters: ["-timeout", "1", "-d", "example.com"],
    },
    metadata: {
      annotations: {
        "metadata.scan.securecodebox.io/subfinder":
          "https://github.com/secureCodeBox/secureCodeBox",
      },
    },
  };

  const fileContent = await readFile(__dirname + "/__testFiles__/empty.jsonl", {
    encoding: "utf8",
  });
  const findings = await parse(fileContent, scan, { includeTargetDomain: true });
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse subfinder json file and add target domain to findings with param -d", async () => {
  const scan = {
    spec: {
      scanType: "subfinder",
      parameters: ["-timeout", "1", "-d", "example.com"],
    },
    metadata: {
      annotations: {
        "metadata.scan.securecodebox.io/subfinder":
          "https://github.com/secureCodeBox/secureCodeBox",
      },
    },
  };

  const fileContent = await readFile(
    __dirname + "/__testFiles__/passive_scan_without_ip_example.com.jsonl",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent, scan, { includeTargetDomain: true });
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse subfinder json file and add target domain to findings with param -domain", async () => {
  const scan = {
    spec: {
      scanType: "subfinder",
      parameters: ["-timeout", "1", "-domain", "example.com"],
    },
    metadata: {
      annotations: {
        "metadata.scan.securecodebox.io/subfinder":
          "https://github.com/secureCodeBox/secureCodeBox",
      },
    },
  };

  const fileContent = await readFile(
    __dirname + "/__testFiles__/passive_scan_without_ip_example.com.jsonl",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent, scan, { includeTargetDomain: true });
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse subfinder json file and add target domain to findings with param --domain=", async () => {
  const scan = {
    spec: {
      scanType: "subfinder",
      parameters: ["-timeout", "1", "--domain=example.com"],
    },
    metadata: {
      annotations: {
        "metadata.scan.securecodebox.io/subfinder":
          "https://github.com/secureCodeBox/secureCodeBox",
      },
    },
  };

  const fileContent = await readFile(
    __dirname + "/__testFiles__/passive_scan_without_ip_example.com.jsonl",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent, scan, { includeTargetDomain: true });
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});
