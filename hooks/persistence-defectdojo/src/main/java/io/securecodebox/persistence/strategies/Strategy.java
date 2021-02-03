package io.securecodebox.persistence.strategies;

import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
import io.securecodebox.persistence.models.Scan;

public interface Strategy {
  void init(DefectDojoConfig defectDojoConfig);

  void run(Scan scan) throws Exception;
}
