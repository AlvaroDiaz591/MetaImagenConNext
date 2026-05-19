import styles from "../styles/AdminKinectPostureSection.module.css";

type KinectInstructionsPanelProps = {
  socketUrl: string;
};

const INSTRUCTIONS = [
  "Conecta el Kinect al equipo y ejecuta tu puente C# para abrir el WebSocket en el puerto 8181.",
  "Verifica la URL del stream y conecta desde este modulo. Puedes usar la IP del equipo donde corre Visual Community.",
  "Coloca al paciente de perfil con hombro y cadera visibles para obtener una estimacion estable de inclinacion.",
  "Usa los controles de tilt para corregir la inclinacion del sensor si la cabeza o la cadera salen del cuadro.",
  "Los datos se procesan en tiempo real: frame RGB, joints 2D, joints 3D, tilt de camara e inclinacion postural.",
];

const KinectInstructionsPanel = ({ socketUrl }: KinectInstructionsPanelProps) => {
  return (
    <article className={styles.instructionCard}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.cardKicker}>Operacion recomendada</span>
          <h3 className={styles.cardTitle}>Flujo de uso del modulo Kinect</h3>
        </div>
      </div>

      <div className={styles.instructionList}>
        {INSTRUCTIONS.map((instruction, index) => (
          <div key={instruction} className={styles.instructionRow}>
            <span className={styles.instructionIcon}>{String(index + 1).padStart(2, "0")}</span>
            <p>{instruction}</p>
          </div>
        ))}
      </div>

      <div className={styles.connectionHintBox}>
        <span>URL activa</span>
        <strong>{socketUrl}</strong>
        <p>Si el puente corre en otra maquina, reemplaza localhost por la IP real del equipo con Kinect.</p>
      </div>
    </article>
  );
};

export default KinectInstructionsPanel;