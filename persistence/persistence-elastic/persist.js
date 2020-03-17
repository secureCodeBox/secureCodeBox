const { Client } = require('@elastic/elasticsearch');

const flatMap = require('lodash.flatmap');
const chunk = require('lodash.chunk');

const client = new Client({ node: process.env['ELASTICSEARCH_ADDRESS'] });

async function persist({
  getFindings,
  scan,
  now = new Date(),
  tenant = process.env['NAMESPACE'],
}) {
  const findings = await getFindings();

  console.log(`Persisting ${findings.length} to Elasticsearch`);

  const timeStamp = now.toISOString().substr(0, 10);
  const indexName = `securecodebox_${tenant}_${timeStamp}`;

  await client.indices.create(
    {
      index: indexName,
      body: {},
    },
    { ignore: [400] }
  );

  const findingsChunks = chunk(findings, 50);

  await client.index({
    index: indexName,
    body: {
      '@timestamp': now,
      type: 'scan',
      id: scan.metadata.uid,
      name: scan.metadata.name,
      scan_type: scan.spec.scanType,
      parameters: scan.spec.parameters,
      labels: scan.metadata.labels || {},
    },
  });

  let i = 0;
  console.log(
    `Sending findings to Elasticsearch in ${findingsChunks.length} chunks of max 50 findings each`
  );
  for (const findingChunk of findingsChunks) {
    console.log(
      `Sending chunk ${i++} containing ${
        findingChunk.length
      } findings to Elasticsearch`
    );
    const body = flatMap(findingChunk, doc => [
      { index: { _index: indexName } },
      {
        ...doc,
        '@timestamp': now,
        type: 'finding',
        scan_id: scan.metadata.uid,
        scan_name: scan.metadata.name,
        scan_type: scan.spec.scanType,
        scan_labels: scan.metadata.labels || {},
      },
    ]);

    const { body: bulkResponse } = await client.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      console.error('Bulk Request had errors:');
      console.log(bulkResponse);
    }
  }
}
module.exports.elasticClient = client;
module.exports.persist = persist;
