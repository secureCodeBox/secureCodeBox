/*
 *  secureCodeBox (SCB)
 *  Copyright 2015-2021 iteratec GmbH
 *  https://www.iteratec.com
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  	http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package io.securecodebox.persistence.strategies;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.kubernetes.client.openapi.models.V1ObjectMeta;
import io.securecodebox.models.V1Scan;
import io.securecodebox.models.V1ScanSpec;
import io.securecodebox.models.V1ScanStatus;
import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
import io.securecodebox.persistence.defectdojo.models.Product;
import io.securecodebox.persistence.defectdojo.models.ProductType;
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
import org.mockito.Spy;
import org.mockito.junit.MockitoJUnitRunner;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.swing.text.html.Option;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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

  private static class MockedScan extends Scan{
    public MockedScan() {
    }

    @Override
    public String getRawResults() {
      return "<xml/>";
    }
  }

  @BeforeEach
  public void setup() throws Exception {
    versionedEngagementsStrategy.config = new DefectDojoConfig("https://defectdojo.example.com", "<key>", "foobar");

    scan = new MockedScan();
    scan.setApiVersion("execution.securecodebox.io/v1");
    scan.setKind("Scan");
    scan.setMetadata(new V1ObjectMeta());
    scan.getMetadata().setName("zap-baseline-juiceshop");
    scan.getMetadata().setNamespace("default");
    scan.setSpec(new V1ScanSpec());
    scan.getSpec().setScanType("zap-baseline");
    scan.getSpec().setParameters(List.of("-t","http://juice-shop.demo-apps.svc:3000", "-j"));
    scan.setStatus(new V1ScanStatus());
  }

  @Test
  @DisplayName("Fails when Configured User can not be looked up in the DefectDojo API")
  void requiresUserToBeFound() throws Exception {
    when(userService.searchUnique(any(User.class))).thenReturn(Optional.empty());

    Assertions.assertThrows(DefectDojoPersistenceException.class, () -> {
      versionedEngagementsStrategy.run(scan);
    });
  }
}
