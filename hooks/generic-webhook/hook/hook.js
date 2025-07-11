// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

export async function handle({
  getFindings,
  scan,
  webhookUrl = process.env["WEBHOOK_URL"],
  webhookUser = process.env["WEBHOOK_USER"],
  webhookPassword = process.env["WEBHOOK_PASSWORD"],
  webhookApikeyHeaderName = process.env["WEBHOOK_APIKEY_HEADER_NAME"],
  webhookApikeyHeaderValue = process.env["WEBHOOK_APIKEY_HEADER_VALUE"],
}) {
  const findings = await getFindings();

  console.log(`Sending ${findings.length} findings to ${webhookUrl}`);

  const body = JSON.stringify({ scan, findings });
  const headers = {
    'Content-Type': 'application/json',
  };

  if (webhookApikeyHeaderName && webhookApikeyHeaderValue) {
    headers[webhookApikeyHeaderName] = webhookApikeyHeaderValue;
  } else if (webhookUser && webhookPassword) {
    const credentials = Buffer.from(`${webhookUser}:${webhookPassword}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed with status ${response.status}: ${await response.text()}`);
  }
}
