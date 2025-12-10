// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test.skip(
  "git-repo-scanner should find at least 1 repository in the GitHub secureCodeBox organisation",
  async () => {
    // This integration tests runs about 30min because of the GitHub Public API call rate limit.
    // If you want to speed up you need to add an valid access token like: ['--git-type', 'GitHub', '--organization', 'secureCodeBox', '--access-token', '23476VALID2345TOKEN'],
    const { count } = await scan(
      "git-repo-scanner-dummy-scan",
      "git-repo-scanner",
      ["--git-type", "github", "--organization", "secureCodeBox"],
    );
    // There must be >= 28 Repositories found in the GitHub secureCodeBox organisation.
    expect(count).toBeGreaterThanOrEqual(28);
  },
  {
    timeout: 3 * 60 * 1000,
  },
);
