// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.strategies;

import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
import io.securecodebox.persistence.defectdojo.models.Finding;
import io.securecodebox.persistence.defectdojo.models.ScanFile;
import io.securecodebox.persistence.models.Scan;

import java.util.List;

/**
 *  Defines a general strategy pattern interface used to implement different strategies for importing results into OWASP DefectDojo.
 */
public interface Strategy {
  void init(DefectDojoConfig defectDojoConfig);

  List<Finding> run(Scan scan, ScanFile scanResultFile) throws Exception;
}
