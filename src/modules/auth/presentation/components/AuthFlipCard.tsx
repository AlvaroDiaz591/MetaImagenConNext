"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { AuthMode } from "@/src/shared/types/AuthMode";
import AudioVolumeSlider from "./AudioVolumeSlider";
import LoginPanel from "@/src/modules/login/presentation/components/LoginPanel";
import NeonNodeBackground from "@/src/modules/login/presentation/components/NeonNodeBackground";
import RegisterPanel from "@/src/modules/registro/presentation/components/RegisterPanel";
import styles from "../styles/AuthFlipCard.module.css";

type AuthFlipCardProps = {
  initialMode: AuthMode;
};

const LOGIN_AUDIO_SRC = "/audio/bienvenidoAMeta.opus";
const DEFAULT_AUDIO_VOLUME = 0.55;

const AuthFlipCard = ({ initialMode }: AuthFlipCardProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isFlipping, setIsFlipping] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioNeedsGesture, setAudioNeedsGesture] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const attemptAudioPlayback = useCallback((nextMuted = audioMuted) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = nextMuted;
    audio.volume = nextMuted ? 0 : DEFAULT_AUDIO_VOLUME;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise
        .then(() => setAudioNeedsGesture(false))
        .catch(() => setAudioNeedsGesture(true));
    }
  }, [audioMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.loop = true;
    audio.preload = "auto";
    audio.muted = audioMuted;
    audio.volume = audioMuted ? 0 : DEFAULT_AUDIO_VOLUME;

    attemptAudioPlayback();
  }, [attemptAudioPlayback, audioMuted, mode]);

  useEffect(() => {
    if (!audioNeedsGesture) {
      return;
    }

    const resumePlayback = () => {
      attemptAudioPlayback();
    };

    window.addEventListener("pointerdown", resumePlayback, { once: true });
    window.addEventListener("keydown", resumePlayback, { once: true });

    return () => {
      window.removeEventListener("pointerdown", resumePlayback);
      window.removeEventListener("keydown", resumePlayback);
    };
  }, [attemptAudioPlayback, audioNeedsGesture]);

  const toggleAudioMute = () => {
    setAudioMuted((current) => {
      const nextMuted = !current;

      if (!nextMuted) {
        window.setTimeout(() => {
          attemptAudioPlayback(false);
        }, 0);
      }

      return nextMuted;
    });
  };

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
      <NeonNodeBackground />

      <audio ref={audioRef} src={LOGIN_AUDIO_SRC} loop aria-hidden="true" />

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

      <aside className={styles.audioDock} aria-label="Control de audio de bienvenida">
        <AudioVolumeSlider
          muted={audioMuted}
          onToggleMute={toggleAudioMute}
        />

        {audioNeedsGesture ? (
          <p className={styles.audioHint}>Si no suena, toca cualquier control para activarlo.</p>
        ) : null}
      </aside>

      <section className={styles.authPerspective}>
        <div className={`${styles.authFlipper} ${mode === "registro" ? styles.isFlipped : ""}`}>
          <article
            className={`${styles.authFace} ${styles.front} ${
              mode === "login" ? styles.mobileActive : styles.mobileHidden
            }`}
          >
            <LoginPanel onCambiarModo={toggleMode} />
          </article>

          <article
            className={`${styles.authFace} ${styles.back} ${
              mode === "registro" ? styles.mobileActive : styles.mobileHidden
            }`}
          >
            <RegisterPanel onCambiarModo={toggleMode} />
          </article>
        </div>
      </section>
    </main>
  );
};

export default AuthFlipCard;
