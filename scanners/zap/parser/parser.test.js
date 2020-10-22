const fs = require("fs");
const util = require("util");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("Parsing the juice-shop results.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/juice-shop.xml",
    {
      encoding: "utf8"
    }
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});

test("Parsing the example.com results.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/example.com.xml",
    {
      encoding: "utf8"
    }
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});

test("Parsing the docs.securecodebox.io results.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/docs.securecodebox.io.xml",
    {
      encoding: "utf8"
    }
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});
