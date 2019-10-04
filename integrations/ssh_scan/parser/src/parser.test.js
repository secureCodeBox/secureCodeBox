const fs = require('fs');
const util = require('util');

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require('./parser');

test('ssh-scan parser parses errored result (no ssh server) to zero findings', async () => {
  const hosts = JSON.parse(await readFile(
    __dirname + '/__testFiles__/localhost.json',
    {
      encoding: 'utf8',
    }
  ));

  const res = await parse(hosts);

  expect(res).toEqual([]);
});

test('ssh-scan parser parses a proper result to proper findings', async () => {
  const hosts = JSON.parse(await readFile(
    __dirname + '/__testFiles__/securecodebox.io.json',
    {
      encoding: 'utf8',
    }
  ));

  const res = await parse(hosts);

  expect(res).toEqual([
    {
      attributes: {
        auth_methods: ['publickey'],
        compliance_policy: 'Mozilla Modern',
        compliant: false,
        compression_algorithms: ['none', 'zlib@openssh.com'],
        encryption_algorithms: [
          'chacha20-poly1305@openssh.com',
          'aes128-ctr',
          'aes192-ctr',
          'aes256-ctr',
          'aes128-gcm@openssh.com',
          'aes256-gcm@openssh.com',
        ],
        grade: 'C',
        hostname: 'securecodebox.io',
        ip_address: '138.201.126.99',
        key_algorithms: [
          'curve25519-sha256@libssh.org',
          'ecdh-sha2-nistp256',
          'ecdh-sha2-nistp384',
          'ecdh-sha2-nistp521',
          'diffie-hellman-group-exchange-sha256',
          'diffie-hellman-group14-sha1',
        ],
        mac_algorithms: [
          'umac-64-etm@openssh.com',
          'umac-128-etm@openssh.com',
          'hmac-sha2-256-etm@openssh.com',
          'hmac-sha2-512-etm@openssh.com',
          'hmac-sha1-etm@openssh.com',
          'umac-64@openssh.com',
          'umac-128@openssh.com',
          'hmac-sha2-256',
          'hmac-sha2-512',
          'hmac-sha1',
        ],
        os_cpe: 'o:canonical:ubuntu:16.04',
        references: ['https://wiki.mozilla.org/Security/Guidelines/OpenSSH'],
        server_banner: 'SSH-2.0-OpenSSH_7.2p2 Ubuntu-4ubuntu2.4',
        ssh_lib_cpe: 'a:openssh:openssh:7.2p2',
        ssh_version: 2,
      },
      category: 'SSH Service',
      description: 'SSH Service Information',
      hint: '',
      id: '49bf7fd3-8512-4d73-a28f-608e493cd726',
      location: 'securecodebox.io',
      name: 'SSH Service',
      osi_layer: 'APPLICATION',
      reference: {},
      severity: 'INFORMATIONAL',
    },
  ]);
});
