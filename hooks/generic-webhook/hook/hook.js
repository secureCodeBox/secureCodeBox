// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

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
