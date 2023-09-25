// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";
import React from "react";
import {useColorMode} from '@docusaurus/theme-common';
import {
  Accordion as AccessibleAccordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
} from "react-accessible-accordion";
import styles from "../css/accordion.module.scss";

export default function Accordion({
  items,
  fullWidth = false,
}: {
  items: { title: string; content: string }[];
  fullWidth?: boolean;
}) {
  const { isDarkTheme } = useColorMode();
  return (
    <AccessibleAccordion
      allowZeroExpanded={true}
      allowMultipleExpanded={false}
      className={clsx(styles.accordion, fullWidth ? "" : styles.width80)}
    >
      {items.map((item, i) => (
        <AccordionItem className={styles.accordionItem} key={i}>
          <AccordionItemHeading>
            <AccordionItemButton
              className={clsx(
                styles.accordionButton,
                isDarkTheme ? styles.dark : null
              )}
            >
              {item.title}
            </AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel className={styles.accordionPanel}>
            {item.content}
          </AccordionItemPanel>
        </AccordionItem>
      ))}
    </AccessibleAccordion>
  );
}
