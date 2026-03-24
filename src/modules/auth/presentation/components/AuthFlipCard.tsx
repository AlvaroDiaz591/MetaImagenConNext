"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { AuthMode } from "@/src/shared/types/AuthMode";
import LoginPanel from "@/src/modules/login/presentation/components/LoginPanel";
import RegisterPanel from "@/src/modules/registro/presentation/components/RegisterPanel";
import styles from "../styles/AuthFlipCard.module.css";

type AuthFlipCardProps = {
  initialMode: AuthMode;
};

const AuthFlipCard = ({ initialMode }: AuthFlipCardProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const toggleMode = () => {
    if (isFlipping) {
      return;
    }

    setIsFlipping(true);
    setMode((current) => (current === "login" ? "registro" : "login"));
    window.setTimeout(() => setIsFlipping(false), 700);
  };

  return (
    <main className={styles.authScene}>
      <div className={styles.ambientOrbOne} aria-hidden="true" />
      <div className={styles.ambientOrbTwo} aria-hidden="true" />

      {mode === "login" ? (
        <div className={styles.brandLogoWrap} aria-hidden="true">
          <div className={styles.brandLogoGlow} />
          <Image
            src="/assets/login/logo.png"
            alt=""
            width={260}
            height={260}
            className={styles.brandLogoImage}
            priority
          />
        </div>
      ) : null}

      <section className={styles.authPerspective}>
        <div className={`${styles.authFlipper} ${mode === "registro" ? styles.isFlipped : ""}`}>
          <article className={`${styles.authFace} ${styles.front}`}>
            <LoginPanel onCambiarModo={toggleMode} />
          </article>

          <article className={`${styles.authFace} ${styles.back}`}>
            <RegisterPanel onCambiarModo={toggleMode} />
          </article>
        </div>
      </section>
    </main>
  );
};

export default AuthFlipCard;
