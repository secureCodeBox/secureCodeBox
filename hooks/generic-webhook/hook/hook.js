// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function handle({
  getFindings,
  scan,
  webhookUrl = process.env["WEBHOOK_URL"],
  webhookUser = process.env["WEBHOOK_USER"],
  webhookPassword = process.env["WEBHOOK_PASSWORD"],
  webhookApikeyHeaderName = process.env["WEBHOOK_APIKEY_HEADER_NAME"],
  webhookApikeyHeaderValue = process.env["WEBHOOK_APIKEY_HEADER_VALUE"],
  axios = require('axios')
}) {
  const findings = await getFindings();

  console.log(`Sending ${findings.length} findings to ${webhookUrl}`);

  if (webhookApikeyHeaderName && webhookApikeyHeaderValue){
    await axios.post(webhookUrl, {scan, findings }, {headers: { [webhookApikeyHeaderName]: webhookApikeyHeaderValue}});
  } else if (webhookUser && webhookPassword){
    await axios.post(webhookUrl, {scan, findings }, {auth: {username: webhookUser, password: webhookPassword}});
  } else {
    await axios.post(webhookUrl, {scan, findings });
  }
}
module.exports.handle = handle;
