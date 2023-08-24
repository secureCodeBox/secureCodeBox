// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence;

import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.config.Config;
import io.securecodebox.persistence.defectdojo.service.EndpointService;
import io.securecodebox.persistence.defectdojo.service.FindingService;
import io.securecodebox.persistence.mapping.DefectDojoFindingToSecureCodeBoxMapper;
import io.securecodebox.persistence.models.Scan;
import io.securecodebox.persistence.service.scanresult.ScanResultService;
import io.securecodebox.persistence.service.KubernetesService;
import io.securecodebox.persistence.service.S3Service;
import io.securecodebox.persistence.strategies.VersionedEngagementsStrategy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.stream.Collectors;

public class DefectDojoPersistenceProvider {
  private static final Logger LOG = LoggerFactory.getLogger(DefectDojoPersistenceProvider.class);

  public static void main(String[] args) throws Exception {
    LOG.info("Starting DefectDojo persistence provider");

    var persistenceProviderConfig = new PersistenceProviderConfig(args);

    var s3Service = new S3Service();
    var kubernetesService = new KubernetesService();
    kubernetesService.init();

    var scan = new Scan(kubernetesService.getScanFromKubernetes());
    scan.validate();

    LOG.info("Downloading Scan Result");
    var scanResultFile = ScanResultService.build(scan, s3Service).getScanResult(persistenceProviderConfig);

    var config = Config.fromEnv();
    LOG.info("Uploading Findings to DefectDojo at: {}", config.getUrl());
    var defectdojoImportStrategy = new VersionedEngagementsStrategy();
    defectdojoImportStrategy.init(config, persistenceProviderConfig);
    var defectDojoFindings = defectdojoImportStrategy.run(scan, scanResultFile);
    LOG.info("Identified total Number of findings in DefectDojo: {}", defectDojoFindings.size());

    if (persistenceProviderConfig.isReadAndWrite()) {
      var endpointService = new EndpointService(config);
      var findingService = new FindingService(config);
      var mapper = new DefectDojoFindingToSecureCodeBoxMapper(config, endpointService, findingService);

      LOG.info("Overwriting secureCodeBox findings with the findings from DefectDojo.");

      var findings = defectDojoFindings.stream()
        .map(mapper::fromDefectDojoFinding)
        .collect(Collectors.toList());

      LOG.debug("Mapped Findings: {}", findings);

      s3Service.overwriteFindings(persistenceProviderConfig.getFindingUploadUrl(), findings);
      kubernetesService.updateScanInKubernetes(findings);
    }

    LOG.info("DefectDojo Persistence Completed");
  }
}
