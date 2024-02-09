// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence;

import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.config.Config;
import io.securecodebox.persistence.defectdojo.model.Finding;
import io.securecodebox.persistence.defectdojo.service.EndpointService;
import io.securecodebox.persistence.defectdojo.service.FindingService;
import io.securecodebox.persistence.mapping.DefectDojoFindingToSecureCodeBoxMapper;
import io.securecodebox.persistence.models.Scan;
import io.securecodebox.persistence.service.KubernetesService;
import io.securecodebox.persistence.service.S3Service;
import io.securecodebox.persistence.service.scanresult.ScanResultService;
import io.securecodebox.persistence.strategies.VersionedEngagementsStrategy;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
public class DefectDojoPersistenceProvider {
  private final S3Service s3Service = new S3Service();
  private final KubernetesService kubernetesService = new KubernetesService();

  public static void main(String[] args) throws Exception {
    new DefectDojoPersistenceProvider().execute(args);
  }

  private void execute(String[] args) throws Exception {
    log.info("Starting DefectDojo persistence provider");
    kubernetesService.init();

    var scan = new Scan(kubernetesService.getScanFromKubernetes());
    scan.validate();

    log.info("Downloading Scan Result");
    var persistenceProviderConfig = new PersistenceProviderConfig(args);
    var scanResultFile = ScanResultService.build(scan, s3Service).getScanResult(persistenceProviderConfig);

    var config = Config.fromEnv();
    log.info("Uploading Findings to DefectDojo at: {}", config.getUrl());
    var defectdojoImportStrategy = new VersionedEngagementsStrategy();
    defectdojoImportStrategy.init(config, persistenceProviderConfig);
    var defectDojoFindings = defectdojoImportStrategy.run(scan, scanResultFile);
    log.info("Identified total Number of findings in DefectDojo: {}", defectDojoFindings.size());

    if (persistenceProviderConfig.isReadAndWrite()) {
      overwriteFindingWithDefectDojoFinding(config, defectDojoFindings, persistenceProviderConfig);
    }

    log.info("DefectDojo Persistence Completed");
  }

  private void overwriteFindingWithDefectDojoFinding(Config config, List<Finding> defectDojoFindings, PersistenceProviderConfig persistenceProviderConfig) throws Exception {
    var endpointService = new EndpointService(config);
    var findingService = new FindingService(config);
    var mapper = new DefectDojoFindingToSecureCodeBoxMapper(config, endpointService, findingService);

    log.info("Overwriting secureCodeBox findings with the findings from DefectDojo.");

    var findings = defectDojoFindings.stream()
      .map(mapper::fromDefectDojoFinding)
      .toList();

    log.debug("Mapped Findings: {}", findings);

    s3Service.overwriteFindings(persistenceProviderConfig.getFindingUploadUrl(), findings);
    kubernetesService.updateScanInKubernetes(findings);
  }

}
