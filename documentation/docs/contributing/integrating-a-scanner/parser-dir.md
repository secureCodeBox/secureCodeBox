---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: parser (Directory)
sidebar_position: 6
---

This directory contains the parser for your scanner to transform the results of your scanner to _Findings_ (see: [Finding | secureCodeBox](/docs/api/finding)).

## Dockerfile

For the parser we use multi-stage builds (see: [Multi-Stage Builds](https://www.docker.com/blog/multi-stage-builds/)).
For our JavaScript Parser SDK the Dockerfile should look like this:

```dockerfile
ARG baseImageTag
FROM node:14-alpine as build
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM securecodebox/parser-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/parser-wrapper/parser/
COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --chown=app:app ./parser.js ./parser.js
```

If your parser does not require any external dependencies, A multi-stage build is not needed.  
Instead, a simpler Dockerfile can be used.

```dockerfile
ARG namespace
ARG baseImageTag
FROM securecodebox/parser-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/parser-wrapper/parser/
COPY --chown=app:app ./parser.js ./parser.js
```

See [Local Deployment](/docs/contributing/local-deployment) for instructions on how to build your parser.

## Parsing SDK

To create a parser for your scanner you will have to execute the following steps in the parser directory:

### Create a new package.json (using `npm init`)

Your `package.json` should look something like this:

```json
{
  "name": "nmap-parser",
  "version": "1.0.0",
  "description": "Parses result files for the type: 'nmap-xml'",
  "main": "",
  "scripts": {},
  "keywords": [],
  "author": "iteratec GmbH",
  "license": "Apache-2.0",
  "dependencies": {
    "lodash": "^4.17.20",
    "xml2js": "^0.4.23"
  },
  "devDependencies": {}
}
```

### Install The Dependencies

If you need additional dependencies you can install them via `npm install`.

### Write Your Parser

Create a `parser.js` file and update the parser function of the Parser SDK. A starting point would be:

```javascript
async function parse(fileContent) {
  return [];
}

module.exports.parse = parse;
```

After your scanner has finished, the Parser SDK will retrieve the output results and call your custom parse function `parse`. The SDK expects a finding object as specified in [Finding | secureCodeBox](/docs/api/finding). The `id`, `parsed_at` and `identified_at` fields can be omitted, as they will be added by the Parser SDK.

### Write Tests for Your Parser

Please provide some tests for your parser in the `parser.test.js` file. To make sure that the output complies with the format specified in [Finding | secureCodeBox](/docs/api/finding) you should call the method `validateParser(parseResult)` from the ParserSDK and assert that it must resolve (not throw errors). You can do so e.g. by calling the following code. See the already existing parsers for reference.

```javascript
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

const findings = await parse(fileContent);
await expect(validateParser(findings)).resolves.toBeUndefined();
```

If you need additional files for your test please save these in the `__testFiles__` directory. Please take a look at [Integration Tests | secureCodeBox](/docs/contributing/integrating-a-scanner/integration-tests) for more information.

Assuming you've set up the scanner [makefile](/docs/contributing/integrating-a-scanner/makefile), you can run your unit test with `make unit-tests`.
