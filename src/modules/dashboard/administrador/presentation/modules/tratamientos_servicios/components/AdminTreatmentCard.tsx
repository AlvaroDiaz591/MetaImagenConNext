import Image from "next/image";
import type { AdminTreatmentItem } from "@/src/modules/dashboard/administrador/domain/entities/AdminTreatment";
import styles from "../styles/AdminTreatmentsSection.module.css";

type Props = {
  item: AdminTreatmentItem;
  index: number;
  loading: boolean;
  onView: (item: AdminTreatmentItem) => void;
  onEdit: (item: AdminTreatmentItem) => void;
  onToggle: (item: AdminTreatmentItem) => void;
  onOpenVideo: (item: AdminTreatmentItem) => void;
};

const moneyFormatter = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

const formatPrice = (value: number | null) => (value === null ? "Precio por evaluar" : moneyFormatter.format(value));

const formatDuration = (value: number | null) => {
  if (!value || value <= 0) return "Duración flexible";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

export default function AdminTreatmentCard({ item, index, loading, onView, onEdit, onToggle, onOpenVideo }: Props) {
  return (
    <article className={`${styles.card} ${!item.activo ? styles.cardInactive : ""}`} style={{ ["--delay" as string]: index }}>
      <div className={styles.cardMedia}>
        {item.imagenUrl ? <Image src={item.imagenUrl} alt={item.nombre} fill className={styles.cardMediaImage} unoptimized /> : null}
        <div className={styles.cardOverlay} />
        <div className={styles.cardBadges}>
          <span className={item.activo ? styles.badgeActive : styles.badgeInactive}>{item.activo ? "Activo" : "Inactivo"}</span>
          {item.destacado ? <span className={styles.badgeFeatured}>Destacado</span> : null}
        </div>
      </div>

      <div className={styles.detailMeta}>
        <span className={styles.summaryChip}>{item.categoria === "kinesiologia" ? "Fisioterapia / Kinesiología" : "Estética"}</span>
        {item.segmento ? <span className={styles.summaryChip}>{item.segmento}</span> : null}
      </div>

      <div>
        <h3 className={styles.cardTitle}>{item.nombre}</h3>
        <p className={styles.cardDescription}>{item.descripcion || "Sin descripción clínica."}</p>
      </div>

      <div className={styles.priceRow}>
        <span>{formatPrice(item.precioDesde ?? item.precio)}</span>
        <span>{formatDuration(item.duracionMinutos)}</span>
      </div>

      <div className={styles.availabilityRow}>
        {item.disponibleEnClinica ? <span className={styles.modeChip}>Clínica</span> : null}
        {item.disponibleADomicilio ? <span className={styles.modeChip}>Domicilio</span> : null}
        {item.mostrarEnWeb ? <span className={styles.modeChip}>Web</span> : null}
        {item.mostrarEnApp ? <span className={styles.modeChip}>App</span> : null}
      </div>

      {item.tags.length ? <div className={styles.chipsWrap}>{item.tags.slice(0, 4).map((tag) => <span key={tag} className={styles.tagChip}>#{tag}</span>)}</div> : null}

      <div className={styles.cardActions}>
        <button type="button" className={styles.actionSecondary} onClick={() => onView(item)}>Ver</button>
        <button type="button" className={styles.softButton} onClick={() => onEdit(item)}>Editar</button>
        {item.videoUrl ? <button type="button" className={styles.ghostButton} onClick={() => onOpenVideo(item)}>Video</button> : null}
        <button type="button" className={styles.actionDanger} onClick={() => onToggle(item)} disabled={loading}>
          {loading ? "Guardando..." : item.activo ? "Inactivar" : "Activar"}
        </button>
      </div>
    </article>
  );
}