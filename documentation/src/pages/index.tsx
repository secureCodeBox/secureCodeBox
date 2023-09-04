// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import {useColorMode} from '@docusaurus/theme-common';
import Layout from "@theme/Layout";
import clsx from "clsx";
import React from "react";
import Accordion from "../components/Accoordion";
import FlipCard from "../components/FlipCard";
import Integration from "../components/Integration";
import RoleCard from "../components/RoleCard";
import Section from "../components/Section";
import styles from "../css/styles.module.scss";
import { Hooks, Scanners } from "../integrations";
import content from "../landingpageContent.js";
import Sections from "../layouts/Sections";

const ScannerIntegrations = () => {
  return (
    <div className="container">
      <h3>Scanners</h3>
      <section className={styles.integrations}>
        {Scanners.map((props, idx) => (
          <Integration key={idx} {...props} />
        ))}
      </section>
    </div>
  );
};

const HookIntegrations = () => {
  return (
    <div className="container">
      <h3>Hooks</h3>
      <section className={styles.integrations}>
        {Hooks.map((props, idx) => (
          <Integration key={idx} {...props} />
        ))}
      </section>
    </div>
  );
};

//* In order to use useColorMode() on the homepage, the main content is separated from the default export due to how "@docusaurus/theme-common" works
function HomePage() {
  const { isDarkTheme } = useColorMode();

  return (
    <>
      <header className={clsx("hero", styles.heroBanner)}>
        <div className="container">
          <h1>Automated Security Testing Tool</h1>
          <p className={styles.description}>
            <em>secureCodeBox</em> is an <a href="https://owasp.org/www-project-securecodebox/">OWASP project</a> providing an automated
            and scalable open source solution that integrates multiple security scanners with a simple and lightweight interface –
            for continuous and automated security testing.
          </p>

          <div className="flex-container">
            <div className="flex-child">
              <Link
                className={clsx("button button--outline button--secondary button--lg",  styles.getStarted)}
                to={useBaseUrl("docs/getting-started/installation")}>
                  Get Started
              </Link>
            </div>

            <div className="flex-child">
              <a href="https://owasp.org/" target="_blank">
                <img className="owasp-project-logo" src={useBaseUrl("/img/OWASP_Logo_White_with_name.png")} />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <Sections>
          <Section
            title="Identify Vulnerabilities in your Network and Applications"
            subtitle="Use the power of leading open source security testing tools with the first of its kind open source multi-scanner platform to run routine scans continuously and automatically on your network infrastructure or applications."
            alignment="center"
          >
            <div className="row margin-bottom--lg">
              {content.automatedTesting.cards.map((card, idx) => (
                <div
                  className={clsx("col", styles.defaultMarginBottom)}
                  key={`flipcard no${idx}`}
                >
                  <FlipCard {...card} />
                </div>
              ))}
            </div>
          </Section>

          <Section
            title={content.useCases.title}
            subtitle={content.useCases.description}
          >
            <Accordion items={content.useCases.items} />
          </Section>

          <Section
            title={content.goToSolution.title}
            subtitle={content.goToSolution.description}
          >
            <div className="row">
              <div className="col padding-left--xl padding-right--xl margin-bottom--lg">
                <img src={content.goToSolution.image} />
              </div>
              <div className={clsx("col", styles.goToSolutionBulletList)}>
                <ul>
                  {content.goToSolution.list.map((item, i) => (
                    <li key={`bullet nr${i}`}>
                      <label>{item.label}</label>
                      <div>{item.content}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section
            title={content.multiScanner.title}
            subtitle={content.multiScanner.description}
            alignment="center"
          >
            <ScannerIntegrations />
            <HookIntegrations />
          </Section>

          <Section
            title={content.about.title}
            subtitle={
              <div>
                <p>
                  {content.about.description}{" "}
                  <a href="https://www.iteratec.com/">iteratec</a>.
                </p>
                <p>
                  <a href="https://owasp.org/">OWASP</a> is an open community dedicated to enabling organizations to conceive,
                  develop, acquire, operate, and maintain applications that can be trusted.
                  All of the OWASP tools, documents, forums, and chapters are free and open
                  to anyone interested in improving application security.
                </p>
              </div>
            }
          >
            <div className="row">
              <div className="col col--4">
                <p>{content.about.question}</p>
                <div>
                  <strong>{content.about.buttonHeader}</strong>
                </div>
                <a
                  className="button button--outline button--primary button--md margin-top--lg  margin-bottom--xl"
                  href={`mailto:${
                    content.about.mail.recipient
                  }?subject=${encodeURI(
                    content.about.mail.subject
                  )}&body=${encodeURI(content.about.mail.message)}`}
                >
                  {content.about.button}
                </a>
              </div>
              {content.about.roles.map((role, i) => (
                <div
                  className={clsx("col", styles.defaultMarginBottom)}
                  key={`role nr${i}`}
                >
                  <RoleCard {...role} />
                </div>
              ))}
            </div>
          </Section>

          <Section title={content.sponsors.title} alignment="center">
            <div className="row margin-bottom--lg">
              {content.sponsors.logos.map((item, i) => (
                <div
                  className={clsx(
                    "col",
                    styles.sponsor,
                    styles.defaultMarginBottom
                  )}
                  key={`sponsor nr${i}`}
                >
                  <a href={item.link} target="_blank">
                    <img src={isDarkTheme ? item.srcDark : item.srcLight} />
                  </a>
                </div>
              ))}
            </div>
          </Section>
        </Sections>
      </main>
    </>
  );
}

export default function Main() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title="Automated Security Testing Tool"
      description={siteConfig.tagline}
      keywords={siteConfig.customFields.keywords}
    >
      <HomePage />
    </Layout>
  );
}
