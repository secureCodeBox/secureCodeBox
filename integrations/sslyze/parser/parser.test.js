const fs = require("fs");
const util = require("util");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("parses badssl.com result file correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/expired.badssl.com.json", {
      encoding: "utf8"
    })
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});

test("parses securecodebox.io result file correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/securecodebox.io.json", {
      encoding: "utf8"
    })
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});
