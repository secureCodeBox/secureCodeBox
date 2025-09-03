// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

import { parse } from "./parser";

test("should properly parse file from inline semgrep usage", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/minimal-metadata.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "cwe": null,
      "owasp_category": null,
      "references": null,
      "rule_source": null,
    },
    "category": "semgrep-result",
    "description": "actual := TruncateName(test.in)",
    "location": "truncatedname_test.go:44-44",
    "name": "-",
    "severity": "HIGH",
  },
]
`);
});

test("should properly parse file with a single result", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/python-injection.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "cwe": "CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')",
      "owasp_category": "A1: Injection",
      "references": [
        {
          "type": "URL",
          "value": "https://owasp.org/www-community/attacks/Command_Injection",
        },
        {
          "type": "CWE",
          "value": "CWE-78",
        },
        {
          "type": "URL",
          "value": "https://cwe.mitre.org/data/definitions/78.html",
        },
      ],
      "rule_source": "https://semgrep.dev/r/python.django.security.injection.command.command-injection-os-system.command-injection-os-system",
    },
    "category": "security",
    "description": "Request data detected in os.system. This could be vulnerable to a command injection and should be avoided. If this must be done, use the 'subprocess' module instead and pass the arguments as a list. See https://owasp.org/www-community/attacks/Command_Injection for more information.",
    "location": "test.py:4-5",
    "name": "python.django.security.injection.command.command-injection-os-system.command-injection-os-system",
    "severity": "MEDIUM",
  },
]
`);
});

test("should properly parse file with multiple results", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/python-injection-multiresult.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "cwe": "CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')",
      "owasp_category": "A1: Injection",
      "references": [
        {
          "type": "URL",
          "value": "https://owasp.org/www-community/attacks/Command_Injection",
        },
        {
          "type": "CWE",
          "value": "CWE-78",
        },
        {
          "type": "URL",
          "value": "https://cwe.mitre.org/data/definitions/78.html",
        },
      ],
      "rule_source": "https://semgrep.dev/r/python.django.security.injection.command.command-injection-os-system.command-injection-os-system",
    },
    "category": "security",
    "description": "Request data detected in os.system. This could be vulnerable to a command injection and should be avoided. If this must be done, use the 'subprocess' module instead and pass the arguments as a list. See https://owasp.org/www-community/attacks/Command_Injection for more information.",
    "location": "test.py:5-6",
    "name": "python.django.security.injection.command.command-injection-os-system.command-injection-os-system",
    "severity": "MEDIUM",
  },
  {
    "attributes": {
      "cwe": "CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')",
      "owasp_category": "A1: Injection",
      "references": [
        {
          "type": "URL",
          "value": "https://owasp.org/www-community/attacks/Command_Injection",
        },
        {
          "type": "CWE",
          "value": "CWE-78",
        },
        {
          "type": "URL",
          "value": "https://cwe.mitre.org/data/definitions/78.html",
        },
      ],
      "rule_source": "https://semgrep.dev/r/python.django.security.injection.command.command-injection-os-system.command-injection-os-system",
    },
    "category": "security",
    "description": "Request data detected in os.system. This could be vulnerable to a command injection and should be avoided. If this must be done, use the 'subprocess' module instead and pass the arguments as a list. See https://owasp.org/www-community/attacks/Command_Injection for more information.",
    "location": "test.py:10-11",
    "name": "python.django.security.injection.command.command-injection-os-system.command-injection-os-system",
    "severity": "MEDIUM",
  },
]
`);
});
