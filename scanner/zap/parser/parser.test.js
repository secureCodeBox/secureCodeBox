const fs = require('fs');
const util = require('util');

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require('./parser');

test('example parser parses empty json to zero findings', async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + '/__testFiles__/juice-shop.json', {
      encoding: 'utf8',
    })
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});
