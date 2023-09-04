// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const docsConfig = {
    temp: "githubRepo", // Name of temporary folder, will be deleted after build
    repository: "secureCodeBox/secureCodeBox", // The repository url without the github part of the link
    targetPath: "docs", // This needs to be 'docs' for the docusaurus build, but you may specify a 'docs/<subdirectory>'
    sizeLimit: 500000, // Limit of file size, most importantly used for large findings.
    findingsDir: "findings", // Directory for large findings which exceeded sizeLimit
    branch: "main",

    // Configures files which will be copied or generated from docsConfig.repository.
    // This is an array of maps.
    //
    // The map has the properties:
    //
    // src:                 required source directory in main repository (docsConfig.repository).
    // dst:                 required target directory in this repository relative to config.targetPath.
    // exclude: (optional)  array of files to exclude from src, default is exclude nothing.
    // keep: (optional)     array of files to keep in dst, default is keep nothing (all files ending with .md will
    //                      be wiped from dst.
    //
    // Example:
    // filesFromRepository: [
    //       {src: "foo", dst: "some/foo", exclude: ["snafu.md", "susfu.md"]},
    //       {src: "bar", dst: "some/bar"},
    //       {src: "bar", dst: "some/bar", keep: ["index.md"]},
    //     ]
    filesFromRepository: [
      {
        src: "docs/adr",
        dst: "architecture/09_architecture_decisions",
        exclude: ["adr_0000.md", "adr_README.md"],
        keep: ["index.md"]
      },
      {
        src: "scanners",
        dst: "scanners",
      },
      {
        src: "hooks",
        dst: "hooks",
      },
    ],
  },
  // This is to configure what to show at the homepage tile-view.
  integrationsConfig = {
    targetFile: "src/integrations.js", // Name of the target file to (over-)write
    integrationDirs: ["hooks", "scanners"], // Names of the directories relative to the root level of the `/docs` folder
    defaultIcon: "img/integrationIcons/Default.svg", // Default Icon when no imageUrl provided or could not resolve imageUrl
  };

module.exports = {
  docsConfig,
  integrationsConfig,
};
