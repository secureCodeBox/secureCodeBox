package io.securecodebox.persistence.strategies;

import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
import io.securecodebox.persistence.defectdojo.models.Finding;
import io.securecodebox.persistence.models.Scan;

import java.util.List;

public interface Strategy {
  void init(DefectDojoConfig defectDojoConfig);

  List<Finding> run(Scan scan, String rawResults) throws Exception;
}
