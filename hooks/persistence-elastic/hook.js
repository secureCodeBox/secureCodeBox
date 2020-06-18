const { Client } = require("@elastic/elasticsearch");

const flatMap = require("lodash.flatmap");
const chunk = require("lodash.chunk");

const authParams = {};

const username = process.env["ELASTICSEARCH_USERNAME"];
const password = process.env["ELASTICSEARCH_PASSWORD"];
const apiKeyId = process.env["ELASTICSEARCH_APIKEY_ID"];
const apiKey = process.env["ELASTICSEARCH_APIKEY"];

if (apiKeyId && apiKey) {
  console.log("Using API Key for Authentication");
  authParams.auth = {
    id: apiKeyId,
    api_key: apiKey,
  };
} else if (username && password) {
  console.log("Using Username/Password for Authentication");
  authParams.auth = {
    username,
    password,
  };
} else {
  console.log(
    "No Authentication credentials provided. Assuming Elasticsearch doesn't require Auth."
  );
}

const client = new Client({
  node: process.env["ELASTICSEARCH_ADDRESS"],
  ...authParams,
});

async function handle({
  getFindings,
  scan,
  now = new Date(),
  tenant = process.env["NAMESPACE"],
  indexPrefix = process.env["ELASTICSEARCH_INDEX_PREFIX"] || "scbv2",
}) {
  const findings = await getFindings();

  console.log(`Persisting ${findings.length} findings to Elasticsearch`);
  console.log(
    `Using Elasticsearch Instance at "${process.env["ELASTICSEARCH_ADDRESS"]}"`
  );

  const timeStamp = now.toISOString().substr(0, 10);
  const indexName = `${indexPrefix}_${tenant}_${timeStamp}`;

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
      "@timestamp": now,
      type: "scan",
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
    const body = flatMap(findingChunk, (doc) => [
      { index: { _index: indexName } },
      {
        ...doc,
        "@timestamp": now,
        type: "finding",
        scan_id: scan.metadata.uid,
        scan_name: scan.metadata.name,
        scan_type: scan.spec.scanType,
        scan_labels: scan.metadata.labels || {},
      },
    ]);

    const { body: bulkResponse } = await client.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      console.error("Bulk Request had errors:");
      console.log(bulkResponse);
    }
  }
}
module.exports.elasticClient = client;
module.exports.handle = handle;
