import Image from "next/image";
import type { AdminTreatmentItem } from "@/src/modules/dashboard/administrador/domain/entities/AdminTreatment";
import styles from "../styles/AdminTreatmentsSection.module.css";

type Props = {
  item: AdminTreatmentItem;
  onClose: () => void;
  onEdit: (item: AdminTreatmentItem) => void;
  onToggle: (item: AdminTreatmentItem) => void;
  onOpenVideo: (item: AdminTreatmentItem) => void;
  loading: boolean;
};

export default function AdminTreatmentDetailModal({ item, onClose, onEdit, onToggle, onOpenVideo, loading }: Props) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalSurface} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.detailHeader}>
          <div>
            <p className={styles.helperText}>Vista del tratamiento</p>
            <h3 className={styles.detailTitle}>{item.nombre}</h3>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose}>Cerrar</button>
        </div>

        <div className={styles.detailLayout}>
          <div className={styles.detailMedia}>
            {item.imagenUrl ? <Image src={item.imagenUrl} alt={item.nombre} fill unoptimized /> : null}
          </div>

          <div className={styles.detailPanel}>
            <div className={styles.detailMeta}>
              <span className={item.activo ? styles.badgeActive : styles.badgeInactive}>{item.activo ? "Activo" : "Inactivo"}</span>
              {item.destacado ? <span className={styles.badgeFeatured}>Destacado</span> : null}
              <span className={styles.summaryChip}>{item.categoria === "kinesiologia" ? "Fisioterapia / Kinesiología" : "Estética"}</span>
              {item.segmento ? <span className={styles.summaryChip}>{item.segmento}</span> : null}
            </div>

            <p className={styles.detailDescription}>{item.descripcion || "Sin descripción clínica."}</p>

            <div className={styles.detailMeta}>
              <span className={styles.summaryChip}>Desde {item.precioDesde !== null ? `Bs ${item.precioDesde.toFixed(2)}` : "precio por evaluar"}</span>
              <span className={styles.summaryChip}>{item.duracionMinutos ? `${item.duracionMinutos} min` : "Duración flexible"}</span>
              <span className={styles.summaryChip}>Orden {item.orden}</span>
            </div>

            <div className={styles.availabilityRow}>
              {item.disponibleEnClinica ? <span className={styles.modeChip}>Clínica</span> : null}
              {item.disponibleADomicilio ? <span className={styles.modeChip}>Domicilio</span> : null}
              {item.mostrarEnWeb ? <span className={styles.modeChip}>Web</span> : null}
              {item.mostrarEnApp ? <span className={styles.modeChip}>App</span> : null}
            </div>

            {item.beneficios.length ? (
              <div>
                <p className={styles.helperText}>Beneficios</p>
                <div className={styles.benefitsWrap}>{item.beneficios.map((beneficio) => <span key={beneficio} className={styles.tagChip}>{beneficio}</span>)}</div>
              </div>
            ) : null}

            {item.tags.length ? (
              <div>
                <p className={styles.helperText}>Tags</p>
                <div className={styles.chipsWrap}>{item.tags.map((tag) => <span key={tag} className={styles.tagChip}>#{tag}</span>)}</div>
              </div>
            ) : null}

            <p className={styles.detailTimestamp}>Actualizado: {item.actualizadoEn ? new Date(item.actualizadoEn).toLocaleString("es-BO") : "sin fecha"}</p>

            <div className={styles.modalActions}>
              <button type="button" className={styles.actionPrimary} onClick={() => onEdit(item)}>Editar</button>
              {item.videoUrl ? <button type="button" className={styles.actionSecondary} onClick={() => onOpenVideo(item)}>Ver video</button> : null}
              <button type="button" className={styles.actionDanger} onClick={() => onToggle(item)} disabled={loading}>
                {loading ? "Guardando..." : item.activo ? "Inactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}