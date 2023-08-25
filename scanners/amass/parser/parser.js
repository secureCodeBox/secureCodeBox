// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const os = require('os');

async function checkifTableExists(db) {
  const query = `select count(*) from sqlite_master m where m.name="assets" OR m.name="relations"`

  return new Promise((resolve, reject) => {
    db.get(query, [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row["count(*)"] === 2);
    });
  });

}

async function openDatabase(fileContent) {
  const tempFilePath = path.join(os.tmpdir(), 'temp-sqlite' + '.sqlite');
  // Write the content to a temporary file
  await fs.promises.writeFile(tempFilePath, fileContent);

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(tempFilePath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(err.message);
        return;
      }
    });
    resolve(db);
  });
}

async function parse(fileContent) {
  const db = await openDatabase(fileContent);
  const tableExists = await checkifTableExists(db);
  if (!tableExists) return [];

  return new Promise((resolve, reject) => {

    const query = `
    WITH relation_chain AS (
      SELECT
        fqdn.content AS subdomain, 
            ips.content AS ip,
            cidr.content AS cidr,
            asn.id AS asn_id,
        asn.content AS asn
      FROM assets fqdn
      
      LEFT JOIN relations r1 ON fqdn.id = r1.from_asset_id AND (r1.type = 'a_record' OR r1.type = 'aaaa_record')
        LEFT JOIN assets ips ON r1.to_asset_id = ips.id
        
        LEFT JOIN relations r2 ON ips.id = r2.to_asset_id AND r2.type = 'contains'
        LEFT JOIN assets cidr ON r2.from_asset_id = cidr.id
        
        LEFT JOIN relations r3 ON cidr.id = r3.to_asset_id AND r3.type = 'announces'
        LEFT JOIN assets asn ON r3.from_asset_id = asn.id
        
        WHERE fqdn.type = 'FQDN'
    )
    SELECT
      rc.subdomain, 
      rc.ip, 
      rc.cidr, 
      rc.asn,
      a.content AS managed_by,
      (SELECT content FROM assets WHERE id = 1) AS domain
    FROM relation_chain rc
    LEFT JOIN relations r ON rc.asn_id = r.from_asset_id AND r.type = 'managed_by'
    LEFT JOIN assets a ON r.to_asset_id = a.id;`;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const results = rows.map((row) => {
        // Parse the stringified JSON values
        const domainObj = JSON.parse(row.domain);
        const subdomainObj = JSON.parse(row.subdomain);
        const ipObj = JSON.parse(row.ip);
        const cidrObj = JSON.parse(row.cidr);
        const asnObj = JSON.parse(row.asn);
        const managedByObj = JSON.parse(row.managed_by);

        return {
          name: subdomainObj.name,
          identified_at: null,
          description: `Found subdomain ${subdomainObj.name}`,
          category: "Subdomain",
          location: subdomainObj.name,
          osi_layer: "NETWORK",
          severity: "INFORMATIONAL",
          attributes: {
            addresses: {
              ip: ipObj?.address || null,
              cidr: cidrObj?.cidr || null,
              asn: asnObj?.number || null,
              desc: managedByObj?.name || null
            },
            domain: domainObj?.name || null,
            hostname: subdomainObj?.name || null,
            ip_addresses: ipObj?.address || null,
          },
        };
      });

      resolve(results);

      db.close((closeErr) => {
        if (closeErr) {
          reject(closeErr.message);
        }
      });
    });
  });
}



module.exports.parse = parse;
