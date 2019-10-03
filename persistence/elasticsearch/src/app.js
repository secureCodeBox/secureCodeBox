const express = require('express');

const app = express();

const { Client } = require('@elastic/elasticsearch');

const { get } = require('./config');

const flatMap = require('lodash.flatmap');
const chunk = require('lodash.chunk');

const client = new Client({ node: get('elasticsearch.address') });

app.use(express.json({
  limit: '10mb'
}));

app.post('/api/v1alpha/scan-job/:scanId/persist', async (req, res) => {
  const { scanId } = req.params;
  const { findings, tenant = 'default' } = req.body;

  const now = new Date();
  const indexName = `securecodebox_${tenant}_${now.toISOString().substr(0,10)}`;

  await client.indices.create(
    {
      index: indexName,
      body: {},
    },
    { ignore: [400] }
  );

  const findingsChunks = chunk(findings, 50);

  for (const findingChunk of findingsChunks) {
    const body = flatMap(findingChunk, doc => [
      { index: { _index: indexName } },
      { '@timestamp': now, type: 'finding_entry', ...doc },
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

  return res.status(204).send();
});

module.exports = app;
