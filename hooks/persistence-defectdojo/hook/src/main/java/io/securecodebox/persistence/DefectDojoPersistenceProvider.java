// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence;

import io.securecodebox.persistence.config.EnvConfig;
import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.config.Config;
import io.securecodebox.persistence.defectdojo.model.Finding;
import io.securecodebox.persistence.defectdojo.service.EndpointService;
import io.securecodebox.persistence.defectdojo.service.FindingService;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.mapping.DefectDojoFindingToSecureCodeBoxMapper;
import io.securecodebox.persistence.models.Scan;
import io.securecodebox.persistence.service.KubernetesService;
import io.securecodebox.persistence.service.S3Service;
import io.securecodebox.persistence.service.scanresult.ScanResultService;
import io.securecodebox.persistence.strategies.VersionedEngagementsStrategy;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
public class DefectDojoPersistenceProvider {
  private static final String JAR_FILE = "defectdojo-persistenceprovider-1.0.0-SNAPSHOT.jar";
  private static final String USAGE = "Usage: java -jar " + JAR_FILE + " <RAW_RESULT_DOWNLOAD_URL> <FINDING_DOWNLOAD_URL> [<RAW_RESULT_UPLOAD_URL> <FINDING_UPLOAD_URL>] [-h|--help]";
  private static final String HELP = """
    This hook imports secureCodeBox findings into DefectDojo.
    
    This provider supports two modes:
    
    1. Read-only Mode:        Only imports the findings oneway from secureCodeBox into DefectDojo.
    2. syncFindingBack Mode:  Replace the finding in secureCodeBox with the finding modified by DefectDojo.
    
    This provider uses positional arguments. The first and second argument is required (Read-only Mode).
    The third and fourth arguments are optional (syncFindingBack Mode).
    
    Required arguments
    
      1st argument (RAW_RESULT_DOWNLOAD_URL):  HTTP URL where the raw finding file (various formats depending on scanner) is available.
      2nd argument (FINDING_DOWNLOAD_URL):     HTTP URL where the secureCodeBox finding file (JSON) is available.
    
    Optional arguments:
    
      3rd argument (RAW_RESULT_UPLOAD_URL):   HTTP URL where to store modified finding file (various formats depending on scanner).
      4th argument (FINDING_UPLOAD_URL):      HTTP URL where to  store modified secureCodeBox finding file (JSON).
      -h|--help                               Show this help.
    
    The hook also looks for various environment variables:
    
    <ENV-VARS>
    
    See the documentation for more details: https://www.securecodebox.io/docs/hooks/defectdojo
    """;
  private static final String HELP_HINT = "Use option -h or --help to get more details about the arguments.";
  private static final int EXIT_CODE_OK = 0;
  private static final int EXIT_CODE_ERROR = 1;
  private final S3Service s3Service = new S3Service();
  private final KubernetesService kubernetesService = new KubernetesService();

  public static void main(String[] args) {
    try {
      new DefectDojoPersistenceProvider().execute(args);
      System.exit(EXIT_CODE_OK);
    } catch (final DefectDojoPersistenceException e) {
      // We do not log stack traces on own errors because the message itself must be helpful enough to fix it!
      log.error(e.getMessage());
      log.error(USAGE);
      log.error(HELP_HINT);
      System.exit(EXIT_CODE_ERROR);
    } catch (final Exception e) {
      // Also log the stack trace as context for unforeseen errors.
      log.error(e.getMessage(), e);
      log.error(USAGE);
      log.error(HELP_HINT);
      System.exit(EXIT_CODE_ERROR);
    }
  }

  private void execute(String[] args) throws Exception {
    log.info("Starting DefectDojo persistence provider");

    if (shouldShowHelp(args)) {
      showHelp();
      return; // Someone showing the help does not expect that anything more is done.
    }

    if (!wrongNumberOfArguments(args)) {
      throw new DefectDojoPersistenceException("Wrong number of arguments!");
    }

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

  boolean shouldShowHelp(String[] args) {
    return Arrays.stream(args).anyMatch(arg -> arg.equals("-h") || arg.equals("--help"));
  }

  private void showHelp() {
    System.out.println(USAGE);
    System.out.println();
    final var envVars = Arrays.stream(EnvConfig.EnvVarNames.values())
      .map(name -> "  " + name.getLiteral() + ": " + name.getDescription())
      .collect(Collectors.joining("\n"));
    System.out.println(HELP.replace("<ENV-VARS>", envVars));
  }

  boolean wrongNumberOfArguments(String[] args) {
    if (args.length == 2) {
      return true;
    }

    if (args.length == 4) {
      return true;
    }

    return false;
  }
}
