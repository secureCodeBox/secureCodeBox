// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.TimeUnit;

public class DeduplicationAwaitingService {
    private static final Logger LOG = LoggerFactory.getLogger(DeduplicationAwaitingService.class);

    Integer refetchWaitSeconds;

    public void refetchWait() {
      try {
        refetchWaitSeconds = Integer.valueOf(System.getenv("DEFECTDOJO_REFETCH_WAIT_SECONDS"));
        if (refetchWaitSeconds > 0) {
          LOG.info("Waiting for {} seconds for deduplication to finish before continuing", refetchWaitSeconds);
          try {
            TimeUnit.SECONDS.sleep(refetchWaitSeconds);
          } catch (InterruptedException e) {
            LOG.warn("Sleeping failed: ", e);
          }
        }
      } catch (NumberFormatException e) {
          LOG.warn("Could not convert the value of DEFECTDOJO_REFETCH_WAIT_SECONDS to an integer: ",e);
      }
    }
}
 