const { Client } = require('@elastic/elasticsearch');

const flatMap = require('lodash.flatmap');
const chunk = require('lodash.chunk');

const client = new Client({ node: process.env['ELASTICSEARCH_ADDRESS'] });
const tenant = process.env['NAMESPACE'];

async function persist({ getFindings, scan, now = new Date() }) {
  const findings = await getFindings();

  console.log(`Persisting ${findings.length} findings.`);

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
      id: scan.metadata.id,
      name: scan.metadata.name,
      scan_type: scan.spec.scanType,
      parameters: scan.spec.parameters,
      labels: scan.metadata.labels || {},
    },
  });

  for (const findingChunk of findingsChunks) {
    const body = flatMap(findingChunk, doc => [
      { index: { _index: indexName } },
      {
        ...doc,
        '@timestamp': now,
        type: 'finding',
        scan_id: scan.metadata.id,
        scan_name: scan.metadata.name,
        scan_type: scan.spec.scanType,
        scan_labels: scan.metadata.labels || {},
      },
    ]);

    const { body: bulkResponse } = await client.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      // The items array has the same order of the dataset we just indexed.
      // The presence of the `error` key indicates that the operation
      // that we did for the document has failed.
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            // If the status is 429 it means that you can retry the document,
            // otherwise it's very likely a mapping error, and you should
            // fix the document before to try it again.
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          });
        }
      });
      console.log(erroredDocuments);
    }
  }
}
module.exports.elasticClient = client;
module.exports.persist = persist;
