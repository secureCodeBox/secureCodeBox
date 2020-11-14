package io.securecodebox.persistence.util;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
public enum SecureCodeBoxScanAnnotations {
  ENGAGEMENT_NAME("defectdojo.securecodebox.io/engagement-name"),
  ENGAGEMENT_VERSION("defectdojo.securecodebox.io/engagement-version"),
  ENGAGEMENT_TAGS("defectdojo.securecodebox.io/engagement-tags"),
  PRODUCT_NAME("defectdojo.securecodebox.io/product-name"),
  PRODUCT_TYPE("defectdojo.securecodebox.io/product-type"),
  PRODUCT_TAGS("defectdojo.securecodebox.io/product-tags"),
  PRODUCT_DESCRIPTION("defectdojo.securecodebox.io/product-description"),
  ;

  @Getter
  private final String label;

  @Override
  public String toString() {
    return this.label;
  }
}
