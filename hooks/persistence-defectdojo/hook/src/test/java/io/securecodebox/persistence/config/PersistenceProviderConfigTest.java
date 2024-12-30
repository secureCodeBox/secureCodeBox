package io.securecodebox.persistence.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PersistenceProviderConfigTest {
  @Test
  void constructorRequiresNonNullArgument() {
    assertThrows(NullPointerException.class, () -> new PersistenceProviderConfig(null));
  }
}
