async function handle({
  getFindings,
  updateFindings,
  attributeName = process.env["ATTRIBUTE_NAME"],
  attributeValue = process.env["ATTRIBUTE_VALUE"],
}) {
  const findings = await getFindings();

  const newFindings = findings.map((finding) => {
    finding.attributes[attributeName] = attributeValue;
    return finding;
  });

  console.log(`Updated attributes on ${findings.length} findings`);

  await updateFindings(newFindings);
}
module.exports.handle = handle;
