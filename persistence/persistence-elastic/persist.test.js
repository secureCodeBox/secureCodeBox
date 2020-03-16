const { persist, elasticClient } = require('./persist');

test('should only send scan summary document if no findings are passing in', async () => {
  const findings = [];

  const getFindings = async () => findings;

  const scan = {
    metadata: {
      id: '09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc',
      name: 'demo-scan',
      labels: {
        company: 'iteratec',
      },
    },
    spec: {
      scanType: 'Nmap',
      parameters: ['-Pn', 'localhost'],
    },
  };

  const now = new Date();

  await persist({ getFindings, scan, now });

  expect(elasticClient.index).toBeCalledTimes(1);
  expect(elasticClient.index).toBeCalledWith({
    body: {
      '@timestamp': now,
      id: '09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc',
      labels: {
        company: 'iteratec',
      },
      name: 'demo-scan',
      parameters: ['-Pn', 'localhost'],
      scan_type: 'Nmap',
      type: 'scan',
    },
    index: 'securecodebox_undefined_2020-03-16',
  });
  expect(elasticClient.bulk).not.toBeCalled();
});
