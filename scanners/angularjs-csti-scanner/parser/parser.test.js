const fs = require("fs");
const util = require("util");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("should properly parse acstis empty finding log file", async () => {
  const findings = await readFile(
    __dirname + "/__testFiles__/acstis-test-empty-findings.txt",
    {
      encoding: "utf8"
    }
  );
  expect(await parse(findings)).toMatchInlineSnapshot(
    'Array []');
});

test("should properly parse acstis finding log file", async () => {
  const findings = await readFile(
    __dirname + "/__testFiles__/acstis-test-findings.txt",
    {
      encoding: "utf8"
    }
  );
  expect(await parse(findings)).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "injectedTemplate": "{{a=toString().constructor.prototype;a.charAt=a.trim;$eval('a,alert(1),a')}}",
          "method": "POST",
          "parameter": "string",
          "url": "https://www.google.com/test/",
        },
        "category": "Template Injection",
        "description": "The given in this finding URL is vulnerable to AngularJS template injection which can lead to XSS",
        "name": "AngularJS template injection",
        "osi_layer": "APPLICATION",
        "severity": "HIGH",
      },
      Object {
        "attributes": Object {
          "injectedTemplate": "{{alert('test')}}",
          "method": "GET",
          "parameter": "category",
          "url": "http://localhost:5000/home?category={{alert('test')}}",
        },
        "category": "Template Injection",
        "description": "The given in this finding URL is vulnerable to AngularJS template injection which can lead to XSS",
        "name": "AngularJS template injection",
        "osi_layer": "APPLICATION",
        "severity": "HIGH",
      },
    ]
  `);
});
