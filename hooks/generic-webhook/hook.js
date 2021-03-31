
async function handle({
  getFindings,
  scan,
  webhookUrl = process.env["WEBHOOK_URL"],
  axios = require('axios')
}) {
  const findings = await getFindings();

  console.log(`Sending ${findings.length} findings to ${webhookUrl}`);

  await axios.post(webhookUrl, { scan, findings });
}
module.exports.handle = handle;
