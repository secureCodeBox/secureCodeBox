const fs = require('fs');
const util = require('util');

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require('./parser');

test('Parsing the juice-shop results.', async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + '/__testFiles__/juice-shop.json', {
      encoding: 'utf8',
    })
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});

test('Parsing the example.com results.', async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + '/__testFiles__/example.com.json', {
      encoding: 'utf8',
    })
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});