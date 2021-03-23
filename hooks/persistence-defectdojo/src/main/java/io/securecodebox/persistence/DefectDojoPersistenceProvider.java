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
package io.securecodebox.persistence;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.KubeConfig;
import io.kubernetes.client.util.generic.GenericKubernetesApi;
import io.securecodebox.models.V1Scan;
import io.securecodebox.models.V1ScanList;
import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.models.Scan;
import io.securecodebox.persistence.strategies.VersionedEngagementsStrategy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileReader;
import java.io.IOException;

public class DefectDojoPersistenceProvider {
  private static final Logger LOG = LoggerFactory.getLogger(DefectDojoPersistenceProvider.class);

  public static void main(String[] args) throws Exception {
    LOG.debug("Starting DefectDojo persistence provider");

    var scan = new Scan(getScanFromKubernetes());
    scan.validate();

    var config = DefectDojoConfig.fromEnv();

    LOG.info("URL: {}", config.getUrl());

    var defectdojoImportStrategy = new VersionedEngagementsStrategy();
    defectdojoImportStrategy.init(config);

    defectdojoImportStrategy.run(scan);
  }

  private static V1Scan getScanFromKubernetes() throws IOException {
    ApiClient client;

    if ("true".equals(System.getenv("IS_DEV"))) {
      // loading the out-of-cluster config, a kubeconfig from file-system
      String kubeConfigPath = System.getProperty("user.home") + "/.kube/config";
      client = ClientBuilder.kubeconfig(KubeConfig.loadKubeConfig(new FileReader(kubeConfigPath))).build();
    } else {
      client = ClientBuilder.cluster().build();
    }

    // set the global default api-client to the in-cluster one from above
    Configuration.setDefaultApiClient(client);

    String scanName = System.getenv("SCAN_NAME");
    if (scanName == null) {
      scanName = "nmap-scanme.nmap.org";
    }
    String namespace = System.getenv("NAMESPACE");
    if (namespace == null) {
      namespace = "default";
    }

    // set the global default api-client to the in-cluster one from above
    Configuration.setDefaultApiClient(client);

    GenericKubernetesApi<V1Scan, V1ScanList> scanApi =
      new GenericKubernetesApi<>(
        V1Scan.class,
        V1ScanList.class,
        "execution.securecodebox.io",
        "v1",
        "scans",
        ClientBuilder.defaultClient());

    var response = scanApi.get(namespace, scanName);

    if (!response.isSuccess()) {
      throw new DefectDojoPersistenceException("Failed to fetch Scan '" + scanName + "' in Namespace '" + namespace + "' from Kubernetes API");
    }
    LOG.info("Fetched Scan from Kubernetes API");

    return response.getObject();
  }
}
