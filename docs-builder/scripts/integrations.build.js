// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs"),
  rimraf = require("rimraf"),
  colors = require("colors"),
  matter = require("gray-matter"),
  { integrationsConfig: config } = require("./utils/config"),
  { removeWhitespaces, capitalizeEach } = require("./utils/capitalizer");

colors.setTheme({
  info: "blue",
  help: "cyan",
  warn: "yellow",
  success: "green",
  error: "red",
});

// For the documentation on this script look at the README.md of this repository

class Integration {
  constructor(title, type, usecase, path, imageUrl) {
    this.title = title;
    this.type = type;
    this.usecase = usecase;
    this.path = path;
    this.imageUrl = imageUrl;
  }

  isEmpty() {
    return !this.title && !this.usecase;
  }
}

if (fs.existsSync(config.targetFile)) {
  rimraf.sync(config.targetFile);

  console.warn(
    `WARN: ${config.targetFile.info} already existed and was removed.`.warn
  );
}

// Inform about subdirectories (this runs asynchronously)
for (const dir of config.integrationDirs) {
  fs.readdir(
    `docs/${dir}`,
    { encoding: "utf8", withFileTypes: true },
    function (err, files) {
      if (err) {
        console.error(
          `ERROR: Could not read directory ${("docs/" + dir).info}.`.error,
          err.message.error
        );
      } else {
        files
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) =>
            console.warn(
              `WARN: Found subdirectory ${dirent.name.help}. If it contains integrations as well you must specify it explicitly.`
                .warn
            )
          );
      }
    }
  );
}

const itgsArray = [];
// Build integrations from files
for (const dir of config.integrationDirs) {
  const integrations = [],
    fileNames = fs
      .readdirSync(`docs/${dir}`, { encoding: "utf8", withFileTypes: true })
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".md"))
      .map((dirent) => dirent.name.split(".").slice(0, -1).join("."));

  for (const fileName of fileNames) {
    const content = fs.readFileSync(`docs/${dir}/${fileName}.md`, {
        encoding: "utf8",
      }),
      attributes = matter(content).data,
      integration = new Integration(
        attributes.title,
        attributes.type,
        attributes.usecase
      );

    if (integration.isEmpty()) {
      console.warn(
        `WARN: Skipping: ${fileName.help}. Frontmatter does not provide required fields.`
          .warn,
        `Title: ${integration.title}`,
        `Description: ${integration.usecase}`
      );
    } else {
      const imageUrl = `img/integrationIcons/${integration.title}.svg`;

      if (fs.existsSync(`static/${imageUrl}`)) {
        integration.imageUrl = imageUrl;
      } else {
        integration.imageUrl = config.defaultIcon;
        console.warn(
          `WARN: Could not resolve ${imageUrl.info}. Using default image.`.warn
        );
      }

      integration.path = `docs/${dir}/${fileName}`;

      integrations.push(integration);
      console.log(`SUCCESS: Created integration for ${fileName.help}.`.success);
    }
  }

  itgsArray.push([dir, integrations]);
}

const itgsMap = new Map(itgsArray),
  itgsStringArray = [],
  itgKeys = [];

itgsMap.forEach((itgObject, itgName) => {
  const constantName = removeWhitespaces(capitalizeEach(itgName));

  itgKeys.push(constantName);

  itgsStringArray.push(`
export const ${constantName} = ${JSON.stringify(itgObject)};
`);
});

itgsStringArray.push(`export default { ${itgKeys.join(",")} };`);

fs.writeFile(`${config.targetFile}`, itgsStringArray.join(""), function (err) {
  if (err) {
    console.error(
      `ERROR: Could not build ${config.targetFile.help}.`.error,
      err.message.error
    );
  }
});
