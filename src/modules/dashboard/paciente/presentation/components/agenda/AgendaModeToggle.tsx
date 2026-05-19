import styles from "../../styles/PatientLanding.module.css";
import type { AppointmentMode } from "../../../domain/entities/PatientAgenda";

type AgendaModeToggleProps = {
  mode: AppointmentMode;
  homeModeEnabled: boolean;
  onChangeMode: (mode: AppointmentMode) => void;
};

const AgendaModeToggle = ({ mode, homeModeEnabled, onChangeMode }: AgendaModeToggleProps) => {
  return (
    <div className={styles.agendaModeGrid}>
      <button
        type="button"
        className={`${styles.agendaModeButton} ${mode === "clinic" ? styles.agendaModeButtonActive : ""}`}
        onClick={() => onChangeMode("clinic")}
      >
        <strong>En clinica</strong>
        <span>Sesion presencial en sucursal</span>
      </button>

      <button
        type="button"
        className={`${styles.agendaModeButton} ${mode === "home" ? styles.agendaModeButtonActive : ""}`}
        onClick={() => onChangeMode("home")}
        disabled={!homeModeEnabled}
      >
        <strong>A domicilio</strong>
        <span>{homeModeEnabled ? "Visita en tu zona habilitada" : "Zona de domicilio no disponible"}</span>
      </button>
    </div>
  );
};

export default AgendaModeToggle;
