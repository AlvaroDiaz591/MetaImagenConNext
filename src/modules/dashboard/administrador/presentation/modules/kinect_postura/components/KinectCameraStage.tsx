import { KINECT_SKELETON_BONES } from "../config/kinectStreamConfig";
import type {
  KinectConnectionState,
  KinectJointMap2D,
  KinectSeverityTone,
} from "../types/kinectPosture";
import styles from "../styles/AdminKinectPostureSection.module.css";

type KinectCameraStageProps = {
  frameSrc: string | null;
  joints2d: KinectJointMap2D;
  angleDeg: number | null;
  postureLabel: string;
  tone: KinectSeverityTone;
  connectionState: KinectConnectionState;
  jointCount: number;
};

const TONE_CLASS_MAP: Record<KinectSeverityTone, string> = {
  neutral: styles.toneNeutral,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

const TONE_COLOR_MAP: Record<KinectSeverityTone, string> = {
  neutral: "#92ffd7",
  success: "#24f1a8",
  warning: "#ffd166",
  danger: "#ff6f91",
};

const CONNECTION_LABELS: Record<KinectConnectionState, string> = {
  idle: "Sin conexion",
  connecting: "Conectando",
  connected: "Stream activo",
  error: "Con error",
};

const KinectCameraStage = ({
  frameSrc,
  joints2d,
  angleDeg,
  postureLabel,
  tone,
  connectionState,
  jointCount,
}: KinectCameraStageProps) => {
  const toneClass = TONE_CLASS_MAP[tone];
  const meterWidth = `${Math.min(100, Math.round((Math.abs(angleDeg || 0) / 30) * 100))}%`;
  const overlayColor = TONE_COLOR_MAP[tone];

  return (
    <article className={styles.cameraCard}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.cardKicker}>Vista del sensor</span>
          <h3 className={styles.cardTitle}>Frame RGB y esqueleto 2D superpuesto</h3>
        </div>
        <span className={`${styles.statusPill} ${toneClass}`}>{CONNECTION_LABELS[connectionState]}</span>
      </div>

      <div className={styles.cameraStage}>
        {frameSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={frameSrc} alt="Frame en vivo del Kinect" className={styles.cameraImage} />
        ) : (
          <div className={styles.cameraPlaceholder}>
            <strong>Sin video del Kinect</strong>
            <p>Conecta el puente WebSocket y ubica al paciente de perfil frente al sensor.</p>
          </div>
        )}

        <div className={styles.cameraGuide} aria-hidden="true" />

        {jointCount > 0 ? (
          <svg className={styles.cameraOverlay} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {KINECT_SKELETON_BONES.map(([startJoint, endJoint]) => {
              const start = joints2d[startJoint];
              const end = joints2d[endJoint];

              if (!start || !end) {
                return null;
              }

              return (
                <line
                  key={`${startJoint}-${endJoint}`}
                  x1={start.x * 100}
                  y1={start.y * 100}
                  x2={end.x * 100}
                  y2={end.y * 100}
                  stroke={overlayColor}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              );
            })}

            {Object.entries(joints2d).map(([jointName, point]) => (
              <circle
                key={jointName}
                cx={point.x * 100}
                cy={point.y * 100}
                r="1.3"
                fill={overlayColor}
              />
            ))}
          </svg>
        ) : null}

        <div className={styles.cameraHudTop}>
          <span className={`${styles.statusPill} ${toneClass}`}>{postureLabel}</span>
          <span className={styles.hudGhostPill}>{jointCount} articulaciones detectadas</span>
        </div>

        <div className={styles.cameraHudBottom}>
          <div className={styles.angleBadge}>
            <span>Inclinacion</span>
            <strong>{angleDeg === null ? "--" : `${angleDeg.toFixed(1)}°`}</strong>
          </div>
          <div className={styles.angleMeter}>
            <span className={styles.angleMeterLabel}>Riesgo postural</span>
            <div className={styles.angleMeterTrack}>
              <span className={`${styles.angleMeterFill} ${toneClass}`} style={{ width: meterWidth }} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default KinectCameraStage;