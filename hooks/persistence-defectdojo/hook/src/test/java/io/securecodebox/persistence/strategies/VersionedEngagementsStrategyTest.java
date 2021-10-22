// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.strategies;

import io.kubernetes.client.openapi.models.V1ObjectMeta;
import io.securecodebox.models.V1ScanSpec;
import io.securecodebox.models.V1ScanStatus;
import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
import io.securecodebox.persistence.defectdojo.models.ScanFile;
import io.securecodebox.persistence.defectdojo.models.User;
import io.securecodebox.persistence.defectdojo.service.*;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.models.Scan;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class VersionedEngagementsStrategyTest {

  @InjectMocks
  VersionedEngagementsStrategy versionedEngagementsStrategy;

  @Mock
  ProductService productService;
  @Mock
  ProductTypeService productTypeService;
  @Mock
  UserService userService;
  @Mock
  ToolTypeService toolTypeService;
  @Mock
  ToolConfigService toolConfigService;
  @Mock
  EngagementService engagementService;
  @Mock
  TestService testService;
  @Mock
  ImportScanService importScanService;

  Scan scan;

  @BeforeEach
  public void setup() throws Exception {
    versionedEngagementsStrategy.config = new DefectDojoConfig("https://defectdojo.example.com", "<key>", "foobar", 1000);
    versionedEngagementsStrategy.persistenceProviderConfig = new PersistenceProviderConfig(new String[]{"http://example.com","http://example.com"});

    scan = new Scan();
    scan.setApiVersion("execution.securecodebox.io/v1");
    scan.setKind("Scan");
    scan.setMetadata(new V1ObjectMeta());
    scan.getMetadata().setName("zap-baseline-scan-juiceshop");
    scan.getMetadata().setNamespace("default");
    scan.setSpec(new V1ScanSpec());
    scan.getSpec().setScanType("zap-baseline-scan");
    scan.getSpec().setParameters(List.of("-t","http://juice-shop.demo-targets.svc:3000", "-j"));
    scan.setStatus(new V1ScanStatus());
  }

  @Test
  @DisplayName("Fails when Configured User can not be looked up in the DefectDojo API")
  void requiresUserToBeFound() throws Exception {
    when(userService.searchUnique(any(User.class))).thenReturn(Optional.empty());

    Assertions.assertThrows(DefectDojoPersistenceException.class, () -> {
      versionedEngagementsStrategy.run(scan, new ScanFile("nmap.xml","<!-- Nmap Report -->"));
    });
  }
}
