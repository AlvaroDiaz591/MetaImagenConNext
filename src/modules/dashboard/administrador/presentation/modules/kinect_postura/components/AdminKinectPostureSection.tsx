"use client";

import KinectCameraStage from "./KinectCameraStage";
import KinectTelemetryPanel from "./KinectTelemetryPanel";
import { useAdminKinectPostureStream } from "../hooks/useAdminKinectPostureStream";
import type { KinectVector3 } from "../types/kinectPosture";
import styles from "../styles/AdminKinectPostureSection.module.css";

type AdminKinectPostureSectionProps = {
  active: boolean;
  themeMode: "dark" | "light";
};

const formatVector = (value: KinectVector3 | null): string => {
  if (!value) {
    return "No detectado";
  }

  return value.map((entry) => entry.toFixed(2)).join(" / ");
};

const AdminKinectPostureSection = ({ active, themeMode }: AdminKinectPostureSectionProps) => {
  const kinect = useAdminKinectPostureStream();

  if (!active) {
    return null;
  }

  if (!kinect.isSupported) {
    return (
      <section className={`${styles.sectionWrap} ${themeMode === "dark" ? styles.sectionDark : styles.sectionLight}`}>
        <article className={styles.unsupportedCard}>
          <span className={styles.cardKicker}>Modulo Kinect</span>
          <h3 className={styles.cardTitle}>Este modulo requiere navegador de escritorio</h3>
          <p>
            Abre el dashboard desde Chrome o Edge en escritorio para conectarte al WebSocket del puente Kinect y ver el
            reconocimiento corporal en vivo.
          </p>
        </article>
      </section>
    );
  }

  const heroStats = [
    {
      label: "Inclinacion actual",
      value: kinect.angleDeg === null ? "--°" : `${kinect.angleDeg.toFixed(1)}°`,
    },
    {
      label: "Joints detectados",
      value: String(kinect.jointCount),
    },
    {
      label: "Visibilidad corporal",
      value: `${kinect.visibilityScore}%`,
    },
    {
      label: "Tilt del sensor",
      value: `${kinect.currentTilt}°`,
    },
  ];

  return (
    <section className={`${styles.sectionWrap} ${themeMode === "dark" ? styles.sectionDark : styles.sectionLight}`}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroBadge}>Postura Kinect en vivo</span>
          <h2 className={styles.heroTitle}>Reconocimiento corporal, frame RGB y analisis postural desde el dashboard</h2>
          <p className={styles.heroLead}>
            Este modulo replica la experiencia de Flutter en Next.js: consume tu puente WebSocket en C#, renderiza el
            cuerpo detectado, calcula la inclinacion entre cadera y hombro y permite controlar el tilt del sensor.
          </p>
        </div>

        <div className={styles.heroStatusColumn}>
          <span className={`${styles.statusPill} ${styles[`tone${kinect.postureTone.charAt(0).toUpperCase()}${kinect.postureTone.slice(1)}`]}`}>
            {kinect.postureLabel}
          </span>
          <strong className={styles.heroStatusText}>{kinect.connectionMessage}</strong>
          <p className={styles.heroStatusHint}>{kinect.bodyRecognitionLabel}</p>
        </div>
      </div>

      <div className={styles.heroStats}>
        {heroStats.map((item) => (
          <article key={item.label} className={styles.heroStatCard}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <div className={styles.contentGrid}>
        <KinectCameraStage
          frameSrc={kinect.latestFrameSrc}
          joints2d={kinect.joints2d}
          angleDeg={kinect.angleDeg}
          postureLabel={kinect.postureLabel}
          tone={kinect.postureTone}
          connectionState={kinect.connectionState}
          jointCount={kinect.jointCount}
        />

        <KinectTelemetryPanel
          socketUrl={kinect.socketUrl}
          onSocketUrlChange={kinect.setSocketUrl}
          connectionState={kinect.connectionState}
          connectionMessage={kinect.connectionMessage}
          error={kinect.error}
          isConnected={kinect.isConnected}
          requiresSecureBridge={kinect.requiresSecureBridge}
          currentTilt={kinect.currentTilt}
          postureLabel={kinect.postureLabel}
          postureTone={kinect.postureTone}
          jointCount={kinect.jointCount}
          visibilityScore={kinect.visibilityScore}
          frameSizeLabel={kinect.frameSizeLabel}
          lastPacketLabel={kinect.lastPacketLabel}
          trackedAnchors={kinect.trackedAnchors}
          onConnect={kinect.connect}
          onDisconnect={kinect.disconnect}
          onTiltUp={() => kinect.sendTiltDelta(4)}
          onTiltDown={() => kinect.sendTiltDelta(-4)}
          onResetTilt={() => kinect.setTiltTarget(0)}
        />
      </div>

      <div className={styles.bottomGrid}>
        <article className={styles.signalCard}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardKicker}>Senales biomecanicas</span>
              <h3 className={styles.cardTitle}>Referencias que llegan desde tu servicio Kinect</h3>
            </div>
          </div>

          <div className={styles.signalGrid}>
            <div className={styles.signalMetric}>
              <span>Hombro central</span>
              <strong>{formatVector(kinect.shoulderVector)}</strong>
            </div>
            <div className={styles.signalMetric}>
              <span>Cadera central</span>
              <strong>{formatVector(kinect.hipVector)}</strong>
            </div>
            <div className={styles.signalMetric}>
              <span>Frames recibidos</span>
              <strong>{kinect.packetCount}</strong>
            </div>
            <div className={styles.signalMetric}>
              <span>Resolucion de frame</span>
              <strong>{kinect.frameSizeLabel}</strong>
            </div>
          </div>

          <p className={styles.signalSummary}>{kinect.bodyRecognitionLabel}</p>
        </article>
      </div>
    </section>
  );
};

export default AdminKinectPostureSection;