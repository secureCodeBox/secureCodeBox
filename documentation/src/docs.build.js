// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs"),
  rimraf = require("rimraf"),
  colors = require("colors"),
  matter = require("gray-matter"),
  path = require('path'),
  { docsConfig: config } = require("./utils/config"),
  { removeWhitespaces } = require("./utils/capitalizer"),
  Mustache = require("mustache");


colors.setTheme({
  info: "blue",
  help: "cyan",
  warn: "yellow",
  success: "green",
  error: "red",
});

// For the documentation on this script look at the README.md of this repository

async function main() {
  const currentDirectory = __dirname; // current directory is /documentation/src
  const parentDirectory = path.dirname(currentDirectory); // parent is /documentation
  const rootDirectory = path.dirname(parentDirectory); // root is /

  const dataArray = await Promise.all(
    config.filesFromRepository.map((dir) =>
      readDirectory(`${rootDirectory}/${dir.src}`, false)
        .then((res) => ({ ...dir, files: res }))
        .catch((err) =>
          console.error(
            `ERROR: Could not read directory at: ${dir}`.error,
            err.message.error
          )
        )
    )
  );

  if (!fs.existsSync(config.targetPath)) {
    fs.mkdirSync(config.targetPath);
  }
  // Clear preexisting findings
  if (fs.existsSync(config.findingsDir)) {
    rimraf.sync(config.findingsDir);
  }

  for (const dir of dataArray) {
    const trgDir = `${config.targetPath}/${dir.dst}`;
    const srcDir = `${rootDirectory}/${dir.src}`;

    // Clears existing md files from directories
    if (fs.existsSync(trgDir)) {
      await removeExistingMarkdownFilesFromDirectory(trgDir, dir.keep);

      console.warn(
        `WARN: ${trgDir.info} already existed and was overwritten.`.warn
      );
    } else {
      fs.mkdirSync(trgDir);
    }

    // If the source directory contains a ".helm-docs.gotmpl" file (such as in /scanners or /hooks), the doc files need to be generated.
    // Else, the docs files are just copied to the destination path.
    dir.files.includes(".helm-docs.gotmpl")
      ? await createDocFilesFromMainRepository(srcDir, trgDir, await readDirectory(srcDir))
      : await copyFilesFromMainRepository(srcDir, trgDir, dir.exclude, dir.keep);
  }
}

main().catch((err) => {
  clearDocsOnFailure();
  console.error(err.stack.error);
});

function readDirectory(dir, dirNamesOnly = true) {
  return new Promise((res, rej) => {
    fs.readdir(
      dir,
      { encoding: "utf8", withFileTypes: true },
      function (err, data) {
        if (err) {
          rej(err);
        } else {
          if (dirNamesOnly) data = data.filter((file) => file.isDirectory());
          const directories = data.map((dirent) => dirent.name);
          res(directories);
        }
      }
    );
  });
}

async function createDocFilesFromMainRepository(relPath, targetPath, dirNames) {
  for (const dirName of dirNames) {
    const readMe = `${relPath}/${dirName}/README.md`;

    if (!fs.existsSync(readMe)) {
      console.log(
        `WARN: Skipping ${dirName.help}: file not found at ${readMe.info}.`.warn
      );
      continue;
    }

    // Read readme content of scanner / hook directory
    const readmeContent = fs.readFileSync(readMe, { encoding: "utf8" });

    const examples = await getExamples(`${relPath}/${dirName}/examples`);

    const imageTypes = await getSupportedImageTypes(`${relPath}/${dirName}/Chart.yaml`);

    // Add a custom editUrl to the frontMatter to ensure that it points to the correct repo
    const { data: frontmatter, content } = matter(readmeContent);
    
    // Either the path contains "secureCodeBox" or "repo" depending on whether the docs are locally generated or in netlify 
    const filePathInRepo = relPath.replace(/^.*(?:secureCodeBox|repo)\//, "");
    const readmeWithEditUrl = matter.stringify(content, {
      ...frontmatter,
      description: frontmatter?.usecase,
      custom_edit_url: `https://github.com/${config.repository}/edit/${config.branch}/${filePathInRepo}/${dirName}/.helm-docs.gotmpl`,
    });

    // Skip File if its marked as "hidden" in its frontmatter
    if (frontmatter.hidden !== undefined && frontmatter.hidden === true) {
      continue;
    }

    const integrationPage = Mustache.render(
      fs.readFileSync(path.join(__dirname, "utils/scannerReadme.mustache"), {
        encoding: "utf8",
      }),
      {
        readme: readmeWithEditUrl,
        examples,
        hasExamples: examples.length !== 0,
        imageTypes,
        hasImageTypes: imageTypes?.length > 0
      }
    );

    let fileName = frontmatter.title ? frontmatter.title : dirName;

    //Replace Spaces in the FileName with "-" and convert to lower case to avoid URL issues
    fileName = fileName.replace(/ /g, "-").toLowerCase();

    const filePath = `${targetPath}/${fileName}.md`;
    fs.writeFileSync(filePath, integrationPage);

    console.log(
      `SUCCESS: Created file for ${dirName.help} at ${filePath.info}`.success
    );
  }
}

async function getExamples(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const dirNames = await readDirectory(dir).catch(() => []);

  if (dirNames.length === 0) {
    console.warn(`WARN: Found empty examples folder at ${dir.info}.`.warn);
    return [];
  }

  return dirNames.map((dirName) => {
    let readMe = "";

    if (fs.existsSync(`${dir}/${dirName}/README.md`)) {
      readMe = matter(
        fs.readFileSync(`${dir}/${dirName}/README.md`, {
          encoding: "utf8",
        })
      ).content;
    }

    let scanContent = null;
    if (fs.existsSync(`${dir}/${dirName}/scan.yaml`)) {
      scanContent = fs.readFileSync(`${dir}/${dirName}/scan.yaml`, {
        encoding: "utf8",
      });
    }

    let findingContent = null;
    let findingSizeLimitReached = null;

    if (fs.existsSync(`${dir}/${dirName}/findings.yaml`)) {
      findingSizeLimitReached =
        fs.statSync(`${dir}/${dirName}/findings.yaml`).size >= config.sizeLimit;

      if (findingSizeLimitReached) {
        console.warn(
          `WARN: Findings for ${dirName.info} exceeded size limit.`.warn
        );

        findingContent = copyFindingsForDownload(
          `${dir}/${dirName}/findings.yaml`
        );
      } else {
        findingContent = fs.readFileSync(`${dir}/${dirName}/findings.yaml`, {
          encoding: "utf8",
        });
      }
    }

    let findings = null;
    if (findingContent && findingSizeLimitReached !== null) {
      findings = {
        value: findingContent,
        limitReached: findingSizeLimitReached,
      };
    }

    return {
      name: removeWhitespaces(dirName),
      exampleReadme: readMe,
      scan: scanContent,
      findings,
    };
  });
}

function getSupportedImageTypes(dir) {
  if (fs.existsSync(dir)) {
    const chartContent = fs.readFileSync(dir, {
      encoding: "utf8",
    });

    // add an opening delimiter to help matter distinguish the file type
    const { data: frontmatter} = matter(['---', ...chartContent.toString().split('\n')].join('\n'));

    if ('annotations' in frontmatter && 'supported-platforms' in frontmatter.annotations) {
     return frontmatter['annotations']['supported-platforms'].split(',');
    }
  }
}

function copyFindingsForDownload(filePath) {
  const dirNames = filePath.split("/"),
    name =
      dirNames[dirNames.indexOf("examples") - 1] +
      "-" +
      dirNames[dirNames.indexOf("examples") + 1],
    targetPath = `/${config.findingsDir}/${name}-findings.yaml`;

  if (!fs.existsSync("static")) {
    fs.mkdirSync("static/");
  }
  if (!fs.existsSync(`static/${config.findingsDir}`)) {
    fs.mkdirSync(`static/${config.findingsDir}`);
  }

  fs.copyFileSync(filePath, "static" + targetPath);
  console.log(`SUCCESS: Created download link for ${name.info}.`.success);

  return targetPath;
}

function clearDocsOnFailure() {
  for (const dir of config.filesFromRepository) {
    const trgDir = `${config.targetPath}/${dir.src}`;

    if (fs.existsSync(trgDir)) {
      removeExistingMarkdownFilesFromDirectory(trgDir, dir.keep)
        .then(() => {
          console.log(
            `Cleared ${trgDir.info} due to previous failure.`.magenta
          );
        })
        .catch((err) => {
          console.error(
            `ERROR: Could not remove ${trgDir.info} on failure.`.error
          );
          console.error(err.message.error);
        });
    }
  }
}


// Copy files from a given src directory from the main repo into the given dst directory
//
// Example: copyFilesFromMainRepository("docs/adr", "docs/architecture/adr");
//          copyFilesFromMainRepository("docs/adr", "docs/architecture/adr", ["adr_0000.md", "adr_README.md"]);
//
// @param src     required source directory in main repository (docsConfig.repository)
// @param dst     required target directory in this repository relative to config.targetPath
// @param exclude optional array of files to exclude from srcPath
// @param keep    optional array of files to keep in dstPath
async function copyFilesFromMainRepository(srcPath, dstPath, exclude, keep) {
  exclude = exclude || [];
  keep = keep || [];

  if (fs.existsSync(srcPath)) {
    console.error(`${srcPath.info}.`.error);
  }

  if (fs.existsSync(dstPath)) {
    await removeExistingMarkdownFilesFromDirectory(dstPath, keep);
  } else {
    fs.mkdirSync(dstPath);
    console.info(`Create target directory ${dstPath.info}...`.success);
  }

  fs.readdirSync(srcPath).map((fileName) => {
    if (!exclude.includes(fileName)) {
      console.log(`Copy ${fileName.info} to ${dstPath.info}...`.success);

      fs.copyFileSync(`${srcPath}/${fileName}`, `${dstPath}/${fileName}`);
    }
  });
}

async function removeExistingMarkdownFilesFromDirectory(dirPath, filesToKeep) {
  console.info(`Remove existing markdown files from ${dirPath.info}`)
  const allFiles = await readDirectory(dirPath, false);
  allFiles
    .filter((fileName) => fileName.endsWith(".md"))
    .filter(fileName => doNotKeepFile(fileName, filesToKeep))
    .forEach((fileName) => {
      const filePath = `${dirPath}/${fileName}`;
      rimraf.sync(filePath);
      console.warn(`WARN: ${filePath} was deleted.`.warn);
    });
}

function doNotKeepFile(fileName, filesToKeep) {
  // Helper method to make it harder to oversee the !. It is easier to see the negation in the name instead
  // somewhere in the used filter invocation.
  return !keepFile(fileName, filesToKeep);
}

function keepFile(fileName, filesToKeep) {
  console.info(`Determine whether to keep '${fileName}' (${filesToKeep})`.info);

  for (let index in filesToKeep) {
    const fileToKeep = filesToKeep[index];

    if (fileName.normalize() === fileToKeep.normalize()) {
      console.info(`Keeping file ${fileName}`.info);
      return true;
    }
  }

  return false;
}
