// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import React from "react";

const Section = ({
  children,
  title,
  subtitle,
  alignment = "left",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string | JSX.Element;
  alignment?: "center" | "left" | "right";
}) => (
  <>
    <div
      style={{
        textAlign: alignment,
      }}
    >
      <h2
        style={{
          margin: "20px 0px",
        }}
      >
        {title}
      </h2>
      <div style={{marginBottom: "40px"}}>{subtitle}</div>
    </div>
    {children}
  </>
);
export default Section;
