// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.strategies;

import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.config.Config;
import io.securecodebox.persistence.defectdojo.model.Finding;
import io.securecodebox.persistence.defectdojo.model.ScanFile;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.models.Scan;

import java.util.List;

/**
 * Defines a general strategy pattern interface used to implement different strategies for importing results into OWASP DefectDojo.
 */
public interface Strategy {
  void init(Config defectDojoConfig, PersistenceProviderConfig persistenceProviderConfig);

  List<Finding> run(Scan scan, ScanFile scanResultFile) throws DefectDojoPersistenceException;
}
