// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import React from "react";

export default function ({
  imageSrc,
  name,
  role,
}: {
  imageSrc: string;
  name: string;
  role: string;
}) {
  const size = "200px";

  return (
    <div className="card" style={{ width: size, margin: "auto" }}>
      <div className="card__image">
        {/* The image is designed ot be square, hence for the best looking result use square images. */}
        <img
          src={imageSrc}
          alt="Role image"
          style={{ height: size, width: size, objectFit: "cover" }}
        />
      </div>
      <div className="card__body">
        <h4>{name}</h4>
        <small>{role}</small>
      </div>
    </div>
  );
}
