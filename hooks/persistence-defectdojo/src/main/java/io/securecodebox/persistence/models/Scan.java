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
package io.securecodebox.persistence.models;

import io.securecodebox.models.V1Scan;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.*;
import java.util.stream.Collectors;

public class Scan extends V1Scan {
  public Scan(){}

  public Scan(V1Scan other) {
    this.setApiVersion(other.getApiVersion());
    this.setKind(other.getKind());
    this.setMetadata(other.getMetadata());
    this.setSpec(other.getSpec());
    this.setStatus(other.getStatus());
  }

  private boolean containsKey(SecureCodeBoxScanAnnotations annotation) {
    if (this.getMetadata().getAnnotations() == null) {
      return false;
    }
    return this.getMetadata().getAnnotations().containsKey(annotation.getLabel());
  }

  private Optional<String> getKey(SecureCodeBoxScanAnnotations annotation) {
    if (!this.containsKey(annotation)) {
      return Optional.empty();
    }
    return Optional.of(this.getMetadata().getAnnotations().get(annotation.getLabel()));
  }

  public void validate() {
    Objects.requireNonNull(this.getStatus());
    Objects.requireNonNull(this.getSpec());
    Objects.requireNonNull(this.getMetadata());
  }

  public Optional<String> getProductName() {
    return this.getKey(SecureCodeBoxScanAnnotations.PRODUCT_NAME);
  }

  public Optional<String> getEngagementName() {
    return this.getKey(SecureCodeBoxScanAnnotations.ENGAGEMENT_NAME);
  }

  public Optional<String> getProductType() {
    return this.getKey(SecureCodeBoxScanAnnotations.PRODUCT_TYPE);
  }

  public Optional<String> getEngagementVersion() {
    return this.getKey(SecureCodeBoxScanAnnotations.ENGAGEMENT_VERSION);
  }

  public Optional<List<String>> getEngagementTags() {
    return this.getKey(SecureCodeBoxScanAnnotations.ENGAGEMENT_TAGS).map(
      (tags) -> new LinkedList<>(Arrays.asList(tags.split(",")))
        .stream()
        .map(String::trim)
        .collect(Collectors.toList())
    );
  }

  public Optional<List<String>> getProductTags() {
    return this.getKey(SecureCodeBoxScanAnnotations.PRODUCT_TAGS).map(
      (tags) -> new LinkedList<>(Arrays.asList(tags.split(",")))
        .stream()
        .map(String::trim)
        .collect(Collectors.toList())
    );
  }

  public Optional<String> getProductDescription() {
    return this.getKey(SecureCodeBoxScanAnnotations.PRODUCT_DESCRIPTION);
  }

  @AllArgsConstructor
  public enum SecureCodeBoxScanAnnotations {
    PRODUCT_TYPE("defectdojo.securecodebox.io/product-type-name"),
    PRODUCT_NAME("defectdojo.securecodebox.io/product-name"),
    PRODUCT_DESCRIPTION("defectdojo.securecodebox.io/product-description"),
    PRODUCT_TAGS("defectdojo.securecodebox.io/product-tags"),
    ENGAGEMENT_NAME("defectdojo.securecodebox.io/engagement-name"),
    ENGAGEMENT_VERSION("defectdojo.securecodebox.io/engagement-version"),
    ENGAGEMENT_TAGS("defectdojo.securecodebox.io/engagement-tags"),
    ;

    @Getter
    private final String label;
  }
}
