const uuid = require('uuid/v4');
const get = require('lodash.get');

async function parse(fileContent) {
  const hosts = fileContent;

  return hosts
    .flatMap(host => {
      if (host.error) {
        return undefined;
      }

      const location = get(host, ['hostname']) || get(host, ['ip']);

      return {
        id: uuid(),
        name: 'SSH Service',
        description: 'SSH Service Information',
        category: 'SSH Service',
        osi_layer: 'APPLICATION',
        severity: 'INFORMATIONAL',
        reference: {},
        hint: '',
        location: location,
        attributes: {
          hostname: get(host, ['hostname']),
          server_banner: get(host, ['server_banner']) || null,
          ssh_version: get(host, ['ssh_version']),
          os_cpe: get(host, ['os_cpe']),
          ssh_lib_cpe: get(host, ['ssh_lib_cpe']),
          compliance_policy: get(host, ['compliance', 'policy']),
          compliant: get(host, ['compliance', 'compliant']),
          grade: get(host, ['compliance', 'grade']),
          references: get(host, ['compliance', 'references']),
          auth_methods: get(host, ['auth_methods']),
          key_algorithms: get(host, ['key_algorithms']),
          encryption_algorithms: get(host, [
            'encryption_algorithms_server_to_client',
          ]),
          mac_algorithms: get(host, ['mac_algorithms_server_to_client']),
          compression_algorithms: get(host, [
            'compression_algorithms_server_to_client',
          ]),
        },
      };
    })
    .filter(Boolean);
}

module.exports.parse = parse;
