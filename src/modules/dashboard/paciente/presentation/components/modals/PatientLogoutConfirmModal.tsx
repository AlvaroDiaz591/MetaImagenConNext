import React from "react";
import styles from "../../styles/patient-landing/navigation/PatientLogoutConfirmModal.module.css";

type PatientLogoutConfirmModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const PatientLogoutConfirmModal = ({ open, onCancel, onConfirm }: PatientLogoutConfirmModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.logoutModalOverlay} role="presentation" onClick={onCancel}>
      <div
        className={styles.logoutModalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.logoutModalContent}>
          <h3 id="logout-modal-title">Cerrar sesion</h3>
          <p id="logout-modal-description">
            Vas a cerrar sesión. ¿Deseas continuar?
          </p>

          <div className={styles.logoutModalActions}>
            <button type="button" className={styles.logoutModalGhostButton} onClick={onCancel}>
              No, volver
            </button>
            <button type="button" className={styles.logoutModalConfirmButton} onClick={onConfirm}>
              Si, cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLogoutConfirmModal;
