// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const repoUrlAnnotationKey = "metadata.scan.securecodebox.io/git-repo-url";

export async function parse(fileContent, scan) {
  if (!fileContent) {
    return [];
  }

  const report = JSON.parse(fileContent);

  if (!report) {
    return [];
  }

  const commitUrlBase = prepareCommitUrl(scan);

  return report.map((finding) => {
    let severity = "MEDIUM";

    if (containsTag(finding.Tags, ["HIGH"])) {
      severity = "HIGH";
    } else if (containsTag(finding.Tags, ["LOW"])) {
      severity = "LOW";
    }

    return {
      name: finding.RuleID,
      description:
        "The name of the rule which triggered the finding: " + finding.RuleID,
      osi_layer: "APPLICATION",
      severity: severity,
      category: "Potential Secret",
      attributes: {
        commit: commitUrlBase + finding.Commit,
        description: finding.Description,
        offender: finding.Secret,
        author: finding.Author,
        email: finding.Email,
        date: finding.Date,
        file: finding.File,
        line_number: finding.StartLine,
        tags: finding.Tags,
        line: finding.Match,
      },
    };
  });
}

function containsTag(tag, tags) {
  let result = tags.filter((longTag) => tag.includes(longTag));
  return result.length > 0;
}

function prepareCommitUrl(scan) {
  if (
    !scan ||
    !scan.metadata.annotations ||
    !scan.metadata.annotations[repoUrlAnnotationKey]
  ) {
    return "";
  }

  var repositoryUrl = scan.metadata.annotations[repoUrlAnnotationKey];

  return repositoryUrl.endsWith("/")
    ? repositoryUrl + "commit/"
    : repositoryUrl + "/commit/";
}
