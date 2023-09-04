// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import {useColorMode} from '@docusaurus/theme-common';
import clsx from "clsx";
import React from "react";
import igStyles from "../css/integration.module.scss";
import styles from "../css/styles.module.scss";

export default function Integration({
  imageUrl,
  title,
  usecase,
  type,
  path,
}: {
  imageUrl?: string;
  title: string;
  usecase: string;
  type?: string;
  path: string;
}) {
  const { isDarkTheme } = useColorMode();

  const imgUrl = useBaseUrl(imageUrl);

  return (
    <Link
      className={clsx(
        igStyles.integration,
        isDarkTheme ? styles.dark : styles.light
      )}
      to={path}
    >
      {imgUrl && (
        <div className="text--center">
          <img className={igStyles.integrationImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>
        {title} {type ? `(${type})` : ""}
      </h3>
      <p>{usecase}</p>
    </Link>
  );
}
