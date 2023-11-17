// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "secureCodeBox",
  tagline: "Continuous automated security testing ✓ multi scanner security platform ✓ scalable open-source tool ✓ lightweight interface ✓",
  url: "https://www.securecodebox.io",
  baseUrl: "/",
  onBrokenLinks: "throw",
  favicon: "img/Favicon.svg",
  organizationName: "secureCodeBox", // Usually your GitHub org/user name.
  projectName: "secureCodeBox", // Usually your repo name.
  customFields: {
    keywords: [
      "security",
      "scanner",
      "automation",
      "devsecops",
      "vulnerability",
      "pipeline",
      "kubernetes",
      "docker",
      "cloud",
      "opensource",
      "owasp",
      "defectdojo",
      "nmap",
      "nikto",
      "nuclei",
      "typo3",
      "joomla",
      "wordpress",
    ],
  },
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        {name: 'og:image', content: 'img/Og_image.png'},
      ],
      navbar: {
        logo: {
          alt: "secureCodeBox Logo",
          src: "img/Logo_Black.svg",
          srcDark: "img/Logo_White.svg",
        },
        items: [
          {
            to: `docs/getting-started/installation`,
            activeBasePath: "docs",
            label: "Docs",
            position: "left",
          },
          { to: "blog", label: "Blog", position: "left" },
          {
            href: "https://github.com/secureCodeBox/",
            position: "right",
            className: "header-github-link",
            "aria-label": "GitHub repository",
          },
          {
            href: "https://owasp.org/www-project-securecodebox/",
            position: "right",
            className: "header-owasp-link",
            "aria-label": "OWASP project",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Style Guide",
                href: "https://github.com/securecodebox/securecodebox/documentation/#style-guide",
              },
              {
                label: "Icons",
                href: "https://www.flaticon.com/",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/secureCodeBox",
              },
              {
                label: "Slack",
                href: 'https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU"',
              },
              {
                label: "Twitter",
                href: "https://twitter.com/securecodebox",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Imprint",
                href: "https://www.iteratec.com/en/legal-notice/",
              },
              {
                label: "Data Protection",
                href: "https://www.iteratec.com/en/data-protection/",
              },
              {
                html: `
                <a href="https://www.netlify.com" target="_blank" rel="noreferrer noopener" aria-label="Deploys by Netlify">
                  <img src="https://www.netlify.com/img/global/badges/netlify-color-accent.svg" alt="Deploys by Netlify" width="114" height="51" />
                </a>
              `,
              },
            ],
          },
        ],
        copyright: `Copyright the secureCodeBox authors. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer').dracula,
        additionalLanguages: ["python", "java", "rust", "yaml", "go"],
      },
    }),
  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.json"),
          editUrl: "https://github.com/securecodebox/securecodebox/edit/main/documentation/",
          lastVersion: "current",
          exclude: ["telemetry.md", "architecture/09_architecture_decisions/adr_0000.md", "architecture/09_architecture_decisions/adr_README.md"],
          versions: {
            current: {
              label: "Current",
              path: "",
            },
          },
        },
        blog: {
          blogTitle: 'Blog on Automated Security Testing',
          blogDescription: 'In this blog the core maintainer will write about the development, roadmap, ideas RFCs etc. of the OWASP secureCodeBox.',
          showReadingTime: true,
          editUrl: "https://github.com/securecodebox/securecodebox/edit/main/documentation/",
          feedOptions: {
            type: "all",
            title: "The secureCodeBox Developer Blog",
            description:
              "In this blog the core maintainer will write about the development, roadmap, ideas RFCs etc. of the OWASP secureCodeBox.",
            copyright: `Copyright © ${new Date().getFullYear()} iteratec GmbH`,
            language: "en",
          },
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],
  themes: ["@docusaurus/theme-live-codeblock"],
  plugins: ["docusaurus-plugin-sass", "@cmfcmf/docusaurus-search-local"],
};
