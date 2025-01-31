// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";
import React, { useState } from "react";
import { useColorMode } from "@docusaurus/theme-common";
import styles from "../css/accordion.module.scss";

type AccordionItem = {
  title: string;
  content: string;
};

type AccordionProps = {
  items: AccordionItem[];
  fullWidth?: boolean;
};

export default function Accordion({ items, fullWidth = false }: AccordionProps) {
  const { isDarkTheme } = useColorMode();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div
      className={clsx(styles.accordion, {
        [styles.width80]: !fullWidth,
      })}
    >
      {items.map((item, i) => {
        const isExpanded = (expandedIndex === i);
        return (
          <div key={i} className={styles.accordionItem}>
            <button
              className={clsx(styles.accordionButton, {
                [styles.dark]: isDarkTheme,
              })}
              onClick={() => handleToggle(i)}
              aria-expanded={isExpanded}
            >
              {item.title}
            </button>

            {isExpanded && (
              <div className={styles.accordionPanel}>{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
