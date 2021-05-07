// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const util = require("util");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("example parser parses empty json to zero findings", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/juice-shop.jsonl",
    {
      encoding: "utf8",
    }
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});
