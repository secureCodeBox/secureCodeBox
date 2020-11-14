package io.securecodebox.persistence.models;

import io.securecodebox.models.V1Scan;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.*;
import java.util.stream.Collectors;

public class Scan extends V1Scan {
  public Scan(V1Scan other) {
    this.setApiVersion(other.getApiVersion());
    this.setKind(other.getKind());
    this.setMetadata(other.getMetadata());
    this.setSpec(other.getSpec());
    this.setStatus(other.getStatus());
  }

  @AllArgsConstructor
  public enum SecureCodeBoxScanAnnotations {
    // Required
    ENGAGEMENT_NAME("defectdojo.securecodebox.io/engagement-name"),
    ENGAGEMENT_VERSION("defectdojo.securecodebox.io/engagement-version"),
    ENGAGEMENT_TAGS("defectdojo.securecodebox.io/engagement-tags"),
    // Required
    PRODUCT_NAME("defectdojo.securecodebox.io/product-name"),
    // Required
    PRODUCT_TYPE("defectdojo.securecodebox.io/product-type"),
    PRODUCT_TAGS("defectdojo.securecodebox.io/product-tags"),
    PRODUCT_DESCRIPTION("defectdojo.securecodebox.io/product-description"),
    ;

    @Getter
    private final String label;
  }

  private boolean containsKey(SecureCodeBoxScanAnnotations annotation) {
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
    return this.getKey(SecureCodeBoxScanAnnotations.ENGAGEMENT_TAGS).map((tags) -> {
      return new LinkedList<>(
        Arrays.asList(tags.split(","))
      ).stream()
        .map(String::trim)
        .collect(Collectors.toList());
    });
  }

  public Optional<List<String>> getProductTags() {
    return this.getKey(SecureCodeBoxScanAnnotations.PRODUCT_TAGS).map((tags) -> {
      return new LinkedList<>(
        Arrays.asList(tags.split(","))
      ).stream()
        .map(String::trim)
        .collect(Collectors.toList());
    });
  }

  public Optional<String> getProductDescription() {
    return this.getKey(SecureCodeBoxScanAnnotations.PRODUCT_DESCRIPTION);
  }
}
