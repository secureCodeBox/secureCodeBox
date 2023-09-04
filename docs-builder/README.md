<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

# Documentation secureCodeBox

This repository sources the [securecodebox.io] website. Our webpage is meant to provide an extensive documentation about our [secureCodeBox] and many helpful guides on how to start and operate it. The website is build with the [Docusaurus] Framework and hosted through [Netlify]. All important decisions about this website are documented in our `/docs/architecture` folder in the [secureCodeBox] repo. If you want to contribute to our website, please follow the Style Guide down below.

## How the Documentation is Structured and Organized

Here we describe where which type of documentation goes:

- We have two main documentation types:
  1. Documentation for end users and
  2. documentation for contributing developers.
- The end user documentation provides groups of documents which are top level in the sidebar in this order:
  - "Getting Started"
  - "HowTos"
  - "Scanners"
  - "Hooks"
- The second type of documentation for contributing is below the group "Contributing".

We do not use the terms "guide" nor "tutorial" at the moment.

## Build and Run

In order to build and run this website you need to install [Node.js and NPM] for your platform. We recommend to use [nvm] to manage your Node.js versions. Finally you download/clone this repository and install all required Node modules:

```bash
cd docs-builder
nvm use
npm install -g npm@8.11.0
npm install
```

Done! :) Now you can start developing and contributing.

For development:

```bash
npm start
```

For production locally:

```bash
npm run build
npm run serve
```

Important note: We extract the documentation for hooks and scanners from their corresponding directory, thus we build them programmatically, the `sidebars.js` and provide information about everything categorized as an integration (scanners, hooks, etc.) to the frontend through the as well programmatically build `src/integrations.js`.

The build is automatically triggered via a pre-hook to the `npm start` and `npm run build` command. But you can run each respective script on it's own, namely:

```bash
npm run build:docs
npm run build:sidebar
npm run build:integrations
```

See each respective script for more information. For simple configuration options have a look at `scripts/utils/config.js`.

And then visit [this](http://localhost:3000/) in your browser.

## Style Guide

The overall design-idea is a clean and professional look. And since [securecodebox.io] serves mostly an informational purpose, it should stay more simplistic than extraordinary, meaning include only information and elements which either are necessary or helpful and very few basic elements for a good look (e.g. fitting background picture).

### Colors

The color scheme is aimed to be basically white with a soft blue coloring as the main color and gentle highlighting. This website should not be monochrome or monotonous, so feel free to include colored elements and icons but use different colors only ever so slightly and avoid strong contrasts.

Included color palette:

```css
--ifm-color-primary: #77b9e8;
--ifm-color-primary-dark: #55a8e2;
--ifm-color-primary-darker: #49a2e0;
--ifm-color-primary-darkest: #3296dc;
--ifm-color-primary-light: #2389d0;
--ifm-color-primary-lighter: #2181c4;
--ifm-color-primary-lightest: #1c6aa1;

--accent-color-main: #00b2bb;
--accent-color-highlight: #37dae2;
```

If new colors will be used standardized, make sure to include them as a variable and list it here with it's purpose.

### Fonts

Fonts should be simple and readable. Nothing fancy or special and not be web loaded. We use currently the provided fonts in the default docusaurus preset.

### Icons & Images

The icons of the integrations should be monochrome. It is important to have an icon which corresponds to the integrations original icon, but does not need to be the same (we do not want to copy the original one's due to licenses). Colored icons should have on the one side, a generally coherent look on the respective page and on the other side, not stand out from the websites blueish theme. Icons should be free licensed or from [flaticon]. [flaticon] is a great source of millions of free icons and it is referenced on the website for it's use already. Images should be fitting and mainly used as background (partially). They should fit the color scheme if possible or do **not** stand out through a high contrast to the website.

Recommended websites for free icons or images:

- [flaticon](https://www.flaticon.com/)
- [iconmonstr](https://iconmonstr.com/)
- [pixabay](https://pixabay.com/)
- [undraw](https://undraw.co/)

## Documentation Guide

Since we work with various different tools, it is even more important to keep a clean and well structured Documentation. Our website's purpose is to provide a comfortable navigation and clear overview. But since no one is going to update the documentation if it's untraceable, it is also very important to keep the documentation's location clear and as less spread as possible throughout our project. So no single-page documentation hidden in the deep structure of a remote repository! In general we keep specific documentation in the respective directory (e.g. the Amass documentation is a README.md in the Amass directory). Documentation can also be housed in this repository, if it is not specifically categorized to something, but follows the guidelines of the documentation build scripts. One key feature our documentations share in order to be put on the website is a frontmatter in each documentation. It is mandatory since at least a title (and for integrations also a description) are required. But it also can provide helpful other information very easily, for a documentation see [frontmatter]. Don't be afraid to use it for including important information, which you can't get/provide otherwise very well, but don't overuse it! For more detailed examples see the following sections.

### Adding a Scanner or Hook

Scanners and hooks are referred to as integrations. Scanners, which are integrated into our [secureCodeBox] repository have their own directories (located at [/scanners/](https://github.com/secureCodeBox/secureCodeBox/tree/master/scanners)) in which the main documentation must be written in a `README.md` file. Hooks have their own respective directory of similar structure. But in general the documentation is build programmatically, so for further information have a look at the respective build script (`scripts/`).

#### Scanner

Additionally you can and (for the sake of aesthetics) should provide an icon in `.svg` format (the fancy icons you see on the "Integrations" page), located at `/src/static/integrationIcons`. Simply name it according to the title in the frontmatter, e.g. if the scanner's title is "Nmap" your filename is "Nmap.svg", it's as simple as that. Each of our scanner has a release svg, which needs to be put in the frontmatter of the respective documentation. Our scanner are structured uniformly with a frontmatter of mandatory fields as follows:

<details>
<summary>Scanner Frontmatter Documentation Structure</summary>
<br>

```md
title: "Nmap"
category: "scanner"
type: "Network"
state: "released"
appVersion: "7.80"
usecase: "Network discovery and security auditing"
```

</details>

You can add and extend categories as you will, but keep the main structure and if one section would be empty, write an explanation why, if it's not obvious. See this as a adjustable template and have a look at what is written in the other scanner's docs.

Besides the frontmatter you can add any markdown content you'd like. Thought it would be preferred if it could match the rough structure of the existing scanner readmes.

#### Hook

To add hook documentation simply add the markdown file to the folder mentioned above. To provide an icon do as explained before for the scanner. Our hooks are structured uniformly with a frontmatter of mandatory fields as follows:

<details>
<summary>Hook Frontmatter Documentation Structure</summary>
<br>

```md
---
title: "Elasticsearch"
path: "hooks/persistence-elastic"
category: "hook"
type: "persistenceProvider"
state: "released"
usecase: "Publishes all Scan Findings to Elasticsearch."
---
```

</details>

### Adding tutorials or developer docs

Currently under development, please provide an explanation to why these are split and how this differentiation is meant.

#### Tutorials

Currently under development, this will be the guide for our "Get Started" tutorials similar to the ones above.

#### Developer docs

Currently under development, this will be the guide for our "Docs" developer documentation similar to the ones above.

## Scripts

Since we want to have our documentation in the main repository available on this site as well, we use some custom scripts to build the documentation structure in the `docs/` folder. These scripts are located at the `scripts/` folder. Each script can be called and work independently from one another. The respective commands are defined in the `package.json` and chained together by a pre-hook to the general build command. If you want to add a new script it should be kept as an individually executable script and follow our naming convention: `<whatItCreatesOrMutates>.<generalOperation>.js`. The configuration for all scripts can be found at `scripts/utils/config.js`. Though our frontend is built in TypeScript, those scripts remain in JavaScript currently.

### Docs Builder

The docs builder script is responsible to retrieve and generate specified folder and files, containing documentation and works as follows:

1. Download the specified github repository into a temporary location.
2. Looks folders in `filesFromRepository.src` property in `docsConfig` under /scripts/utils/config.js
3. If the folder has a `.helm-docs.gotmpl` file (such as /hooks or /scanners), then the corresponding `.md` files are generated into the folder indicated by `dst`
   1. If an `/examples` subdirectory exists composite examples part, else continue on step 5.
   2. Build a tab for each subdirectory in the `/examples` directory.
   3. In each tab add contents of the respective example `README.md` and build new tabs for `scan.yaml` and `findings.yaml` (all files are optional).
   4. If `findings.yaml` exceeds size limit, create downloadable file and embed respective link.
   5. Concatenate example part to previous `README.md`
4. If the folder does not have a `.helm-docs.gotmpl` file, then the files are simply copied as is, while exluding the file names under the `exclude` array   
5. Delete temporary folder.

The target file structure will look something like this (in the root directory):

```txt
|-...
|- <targetPath>
|-|- <filesFromRepository.dst>
|-|-|- <README.md as <frontmatter title>.md from filesFromRepository.src>
```

This script overrides all existing subdirectories within 'targetPath', with the same name as as the names in 'filesFromRepository.src'.
This script does not check for markdown files but for files named 'README.md'.
The subdirectories are not required to contain a README.md.

Its configuration options are:

```ts
temp: string, // Name of temporary folder, will be deleted after build
repository: string, // The repository url without the github part of the link
targetPath: string, // This needs to be 'docs' for the docusaurus build, but you may specify a 'docs/<subdirectory>'
srcDirs: string[], // Directory names, relative to the root directory of the github project, containing the subdirectories with documentation
sizeLimit: number, // Limit of file size, most importantly used for large findings.
findingsDir: string, // Directory for large findings which exceeded sizeLimit
filesFromRepository: { // Files that need to be brought from the main repository
  src: string // Path of the directory to be copied or generated, relative to the main repository's root
  dst: string // Where the files need to copied in this repository
  exclude: string[] // File names that should be ignored 
}
```

### Integrations builder

This script builds an `integrations.js` file, parsing frontmatter information into objects.
It reads the files of the given directories (not the subdirectories) and retrieves frontmatter data, parsing it to objects of type `Integration` (see below) and joins them into importable modules, respective to the given directories. The required fields in the frontmatter of an integration are:

```yaml
---
title: <title>
usecase: <usecase>
---
```

The Integration class looks like this:

```js
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
```

Its configuration options are:

```ts
targetFile: string, // Name of the target file to (over-)write
integrationDirs: string[], // Names of the directories relative to the root level of the `/docs` folder
defaultIcon: string, // Default Icon when no imageUrl provided or could not resolve imageUrl
```

## Production Deployment

All changes pushed to the `master` branch get automatically build by [Netlify]. This also means that the `npm run build` command is executed, thus executing our custom build scripts through a pre-hook.

# Architecture Documentation

The architecture documentation is located under `docs/architecture/`.

## Architecture Diagrams

The PNG files are made with [Draw.io][draw.io]. They contain the metadata for Draw.io, so you can simply open the file in Draw.io. **It's important that you save the files as _editable bitmap image_**.

Files ending with `.puml` are made with [PlantUML][plantuml]. Here we commit the text file **and** the generated PNG file. 

[securecodebox.io]: https://securecodebox.github.io
[securecodebox]:    https://github.com/secureCodeBox/secureCodeBox
[docusaurus]:       https://v2.docusaurus.io/
[netlify]:          https://www.netlify.com/
[node.js and npm]:  https://nodejs.org/en/download/
[nvm]:              https://github.com/nvm-sh/nvm
[frontmatter]:      https://v2.docusaurus.io/docs/markdown-features/#markdown-headers
[draw.io]:          https://app.diagrams.net/
[plantuml]:         https://plantuml.com/
