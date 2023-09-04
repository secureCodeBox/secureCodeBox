import clsx from "clsx";
import React, { useState } from "react";
import styles from "../css/flipcard.module.scss";

const FlipCard = ({
  title,
  description,
  imgSrc,
}: {
  title: string;
  description: string;
  imgSrc: string;
}) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      className={clsx(styles.flipcard, { [styles.flipcardFlip]: flipped })}
    >
      <div className={styles.flipcardInner}>
        <div className={styles.flipcardFront}>
          <img src={imgSrc} className={styles.flipcardLogo} />
          <h4>{title}</h4>
        </div>
        <div className={clsx(styles.flipcardBack)}>{description}</div>
      </div>
    </div>
  );
};
export default FlipCard;
