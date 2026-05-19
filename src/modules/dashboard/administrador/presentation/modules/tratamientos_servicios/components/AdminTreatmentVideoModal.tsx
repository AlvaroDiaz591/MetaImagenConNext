import styles from "../styles/AdminTreatmentsSection.module.css";

type Props = {
  title: string;
  url: string;
  onClose: () => void;
};

export default function AdminTreatmentVideoModal({ title, url, onClose }: Props) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={`${styles.modalSurface} ${styles.videoModal}`} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.detailHeader}>
          <div>
            <p className={styles.helperText}>Video promocional</p>
            <h3 className={styles.detailTitle}>{title}</h3>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose}>Cerrar</button>
        </div>
        <div className={styles.videoStage}>
          <video src={url} controls className={styles.videoPlayer}>
            Tu navegador no soporta reproducción de video.
          </video>
        </div>
      </div>
    </div>
  );
}