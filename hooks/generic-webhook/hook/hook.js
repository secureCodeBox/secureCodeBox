// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function handle({
  getFindings,
  scan,
  webhookUrl = process.env["WEBHOOK_URL"],
  webhookUser = process.env["WEBHOOK_USER"],
  webhookPassword = process.env["WEBHOOK_PASSWORD"],
  webhookApikey = process.env["WEBHOOK_APIKEY"],
  webhookApikeySecret = process.env["WEBHOOK_APIKEY_SECRET"],
  axios = require('axios')
}) {
  const findings = await getFindings();

  console.log(`Sending ${findings.length} findings to ${webhookUrl}`);

  if (webhookApikey && webhookApikeySecret){
    await axios.post(webhookUrl, {scan, findings }, {headers: { webhookApikey: webhookApikeySecret}});
  }else if (webhookUser && webhookPassword){
    await axios.post(webhookUrl, {scan, findings }, {auth: {username: webhookUser, password: webhookPassword}});
  }else{
    await axios.post(webhookUrl, {scan, findings });
  }
}
module.exports.handle = handle;
