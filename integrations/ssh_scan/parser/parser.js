async function parse(fileContent) {
  const hosts = fileContent;

  return hosts
    .flatMap(host => {
      if (host.error) {
        return undefined;
      }

      const location = host.hostname || host.ip;
      const compliance = host.compliance;

      return {
        name: 'SSH Service',
        description: 'SSH Service Information',
        category: 'SSH Service',
        osi_layer: 'APPLICATION',
        severity: 'INFORMATIONAL',
        reference: {},
        hint: '',
        location: location,
        attributes: {
          hostname: host.hostname || null,
          ip_address: host.ip,
          server_banner: host.server_banner || null,
          ssh_version: host.ssh_version || null,
          os_cpe: host.os_cpe,
          ssh_lib_cpe: host.ssh_lib_cpe,
          compliance_policy: compliance && compliance.policy,
          compliant: compliance && compliance.compliant,
          grade: compliance && compliance.grade,
          references: compliance && compliance.references,
          auth_methods: host.auth_methods,
          key_algorithms: host.key_algorithms,
          encryption_algorithms: host.encryption_algorithms_server_to_client,
          mac_algorithms: host.mac_algorithms_server_to_client,
          compression_algorithms: host.compression_algorithms_server_to_client,
        },
      };
    })
    .filter(Boolean);
}

module.exports.parse = parse;
