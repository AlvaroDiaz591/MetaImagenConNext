import type {
  KinectConnectionState,
  KinectSeverityTone,
  KinectTrackedAnchor,
} from "../types/kinectPosture";
import styles from "../styles/AdminKinectPostureSection.module.css";

type KinectTelemetryPanelProps = {
  socketUrl: string;
  onSocketUrlChange: (value: string) => void;
  connectionState: KinectConnectionState;
  connectionMessage: string;
  error: string;
  isConnected: boolean;
  requiresSecureBridge: boolean;
  currentTilt: number;
  postureLabel: string;
  postureTone: KinectSeverityTone;
  jointCount: number;
  visibilityScore: number;
  frameSizeLabel: string;
  lastPacketLabel: string;
  trackedAnchors: KinectTrackedAnchor[];
  onConnect: () => void;
  onDisconnect: () => void;
  onTiltUp: () => void;
  onTiltDown: () => void;
  onResetTilt: () => void;
};

const CONNECTION_TEXT: Record<KinectConnectionState, string> = {
  idle: "Conectar",
  connecting: "Conectando...",
  connected: "Reconectar",
  error: "Reintentar",
};

const TONE_CLASS_MAP: Record<KinectSeverityTone, string> = {
  neutral: styles.toneNeutral,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

const KinectTelemetryPanel = ({
  socketUrl,
  onSocketUrlChange,
  connectionState,
  connectionMessage,
  error,
  isConnected,
  requiresSecureBridge,
  currentTilt,
  postureLabel,
  postureTone,
  jointCount,
  visibilityScore,
  frameSizeLabel,
  lastPacketLabel,
  trackedAnchors,
  onConnect,
  onDisconnect,
  onTiltUp,
  onTiltDown,
  onResetTilt,
}: KinectTelemetryPanelProps) => {
  const toneClass = TONE_CLASS_MAP[postureTone];

  return (
    <div className={styles.sidePanel}>
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardKicker}>Puente WebSocket</span>
            <h3 className={styles.cardTitle}>Conexion con tu servicio C#</h3>
          </div>
        </div>

        <label className={styles.fieldLabel}>
          <span>URL del puente Kinect</span>
          <input
            className={styles.socketInput}
            type="text"
            value={socketUrl}
            onChange={(event) => onSocketUrlChange(event.target.value)}
            placeholder="ws://localhost:8181"
          />
        </label>

        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={onConnect} disabled={connectionState === "connecting"}>
            {CONNECTION_TEXT[connectionState]}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onDisconnect} disabled={!isConnected && connectionState !== "error"}>
            Desconectar
          </button>
        </div>

        <div className={styles.metaList}>
          <div className={styles.metaItem}>
            <span>Estado</span>
            <strong>{connectionMessage}</strong>
          </div>
          <div className={styles.metaItem}>
            <span>Ultimo paquete</span>
            <strong>{lastPacketLabel}</strong>
          </div>
          <div className={styles.metaItem}>
            <span>Resolucion</span>
            <strong>{frameSizeLabel}</strong>
          </div>
        </div>

        {requiresSecureBridge ? (
          <p className={styles.warningText}>Si el dashboard corre bajo HTTPS, el puente debe exponerse por WSS o ejecutarse en localhost.</p>
        ) : null}
        {error ? <p className={styles.inlineError}>{error}</p> : null}
      </article>

      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardKicker}>Control del sensor</span>
            <h3 className={styles.cardTitle}>Ajuste de inclinacion y lectura</h3>
          </div>
          <span className={`${styles.statusPill} ${toneClass}`}>{postureLabel}</span>
        </div>

        <div className={styles.tiltGrid}>
          <button type="button" className={styles.secondaryButton} onClick={onTiltUp} disabled={!isConnected}>
            Apuntar arriba
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onTiltDown} disabled={!isConnected}>
            Apuntar abajo
          </button>
          <button type="button" className={styles.ghostButton} onClick={onResetTilt} disabled={!isConnected}>
            Nivelar camara
          </button>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.miniStat}>
            <span>Tilt actual</span>
            <strong>{currentTilt}°</strong>
          </div>
          <div className={styles.miniStat}>
            <span>Joints 2D</span>
            <strong>{jointCount}</strong>
          </div>
          <div className={styles.miniStat}>
            <span>Visibilidad</span>
            <strong>{visibilityScore}%</strong>
          </div>
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardKicker}>Reconocimiento corporal</span>
            <h3 className={styles.cardTitle}>Anclas del esqueleto detectadas</h3>
          </div>
        </div>

        <div className={styles.anchorGrid}>
          {trackedAnchors.map((anchor) => (
            <span
              key={anchor.id}
              className={`${styles.anchorChip} ${anchor.active ? styles.anchorChipActive : styles.anchorChipInactive}`}
            >
              {anchor.label}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
};

export default KinectTelemetryPanel;