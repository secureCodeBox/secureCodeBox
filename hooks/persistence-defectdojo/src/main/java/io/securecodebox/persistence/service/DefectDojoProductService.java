/*
 *
 *  SecureCodeBox (SCB)
 *  Copyright 2015-2020 iteratec GmbH
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
 * /
 */
package io.securecodebox.persistence.service;

import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.exceptions.DefectDojoProductNotFound;
import io.securecodebox.persistence.models.DefectDojoProduct;
import io.securecodebox.persistence.models.DefectDojoResponse;
import io.securecodebox.persistence.models.ProductPayload;
import io.securecodebox.persistence.models.ProductResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.text.MessageFormat;
import java.util.List;

@Component
public class DefectDojoProductService {

  @Value("${securecodebox.persistence.defectdojo.url}")
  protected String defectDojoUrl;

  @Value("${securecodebox.persistence.defectdojo.auth.key}")
  protected String defectDojoApiKey;

  @Value("${securecodebox.persistence.defectdojo.auth.name}")
  protected String defectDojoDefaultUserName;

  private static final Logger LOG = LoggerFactory.getLogger(DefectDojoProductService.class);

  /**
   * TODO: move to a seperate connection class
   *
   * @return The DefectDojo Authentication Header
   */
  private HttpHeaders getDefectDojoAuthorizationHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Token " + defectDojoApiKey);
    return headers;
  }

  /**
   * Returns the DefectDojo productId for the given productName, otherwise throws an DefectDojoProductNotFound exception.
   *
   * @param productName The productName to return the productId for.
   * @return The DefectDojo productId for the given productName.
   * @throws DefectDojoProductNotFound If the productName wasn't found or is not existing in DefectDojo.
   */
  public long getProductId(String productName) throws DefectDojoProductNotFound {
    RestTemplate restTemplate = new RestTemplate();

    String uri = defectDojoUrl + "/api/v2/products/?name=" + productName;
    HttpEntity productRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());
    ResponseEntity<DefectDojoResponse<DefectDojoProduct>> productResponse = restTemplate.exchange(uri, HttpMethod.GET, productRequest, new ParameterizedTypeReference<DefectDojoResponse<DefectDojoProduct>>() {
    });
    if (productResponse.getBody().getCount() == 0) {
      throw new DefectDojoProductNotFound(MessageFormat.format("Could not find productName: \"{0}\" in DefectDojo", productName));
    }

    for (var product : productResponse.getBody().getResults()) {
      if (productName.equals(product.getName())) {
        return product.getId();
      }
    }

    throw new DefectDojoProductNotFound(MessageFormat.format("DefectDojo Product API Returned multiple products but non matched the productNmae: \"{0}\"", productName));
  }

  /**
   * Returns the corresponding productId for the given product details.
   * It will be created automatically if not already existing.
   *
   * @param productName        The name of the DefectDojo product.
   * @param productDescription The description of the DefectDojo product.
   * @param productTags        A list of tags of the DefectDojo product.
   * @return The productId for the given product details.
   */
  public long retrieveOrCreateProduct(String productName, String productDescription, List<String> productTags) {
    long productId = 0;
    try {
      productId = getProductId(productName);
    } catch (DefectDojoProductNotFound e) {
      LOG.debug("Given product does not exists");
    }
    if (productId == 0) {
      ProductResponse productResponse = createProduct(productName, productDescription, productTags);
      productId = productResponse.getId();
    }
    return productId;
  }

  public ProductResponse createProduct(String productName, String description, List<String> productTags) {
    RestTemplate restTemplate = new RestTemplate();
    ProductPayload productPayload = new ProductPayload(productName, description, productTags);
    HttpEntity<ProductPayload> payload = new HttpEntity<>(productPayload, getDefectDojoAuthorizationHeaders());

    try {
      ResponseEntity<ProductResponse> response = restTemplate.exchange(defectDojoUrl + "/api/v2/products/", HttpMethod.POST, payload, ProductResponse.class);
      return response.getBody();
    } catch (HttpClientErrorException e) {
      LOG.warn("Failed to create product {}", e);
      LOG.warn("Failure response body. {}", e.getResponseBodyAsString());
      throw new DefectDojoPersistenceException("Failed to create product", e);
    }
  }
}
