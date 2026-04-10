import { memo } from "react";
import styles from "../styles/AdminDashboard.module.css";
import { getModuleSchema } from "../modules/moduleRegistry";
import { getColumnLabel, isColumnVisible } from "../modules/shared/moduleSchema";

type AdminSectionDataTableProps = {
  seccionActiva: string;
  columnas: string[];
  filas: Array<Record<string, unknown>>;
  onViewRow: (row: Record<string, unknown>) => void;
  onEditRow?: (row: Record<string, unknown>) => void;
  onToggleActiveRow?: (row: Record<string, unknown>) => void;
  onMarkReadRow?: (row: Record<string, unknown>) => void;
  actionLoadingId?: number | null;
};

type RowStatus = {
  isActive: boolean;
  label: string;
};

const stringify = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const getRecordId = (row: Record<string, unknown>): number | null => {
  const rawId = row.id;
  if (typeof rawId === "number" && Number.isFinite(rawId)) return rawId;
  if (typeof rawId === "string") {
    const parsed = Number(rawId);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getRowStatus = (row: Record<string, unknown>): RowStatus | null => {
  const estado = row.estado;
  if (typeof estado === "string") {
    const normalized = estado.trim().toLowerCase();
    const isActive = normalized !== "inactivo" && normalized !== "inactive";
    return {
      isActive,
      label: isActive ? "Activo" : "Inactivo",
    };
  }

  const activo = row.activo;
  if (typeof activo === "boolean") {
    return {
      isActive: activo,
      label: activo ? "Activo" : "Inactivo",
    };
  }

  return null;
};

const getPrimaryText = (row: Record<string, unknown>): string => {
  const candidates = [
    "nombre",
    "titulo",
    "modulo",
    "codigo_paciente",
    "numero_personal",
    "numero_empleado",
    "email",
    "correo_electronico",
  ];

  for (const key of candidates) {
    const value = stringify(row[key]).trim();
    if (value) {
      return value;
    }
  }

  return "Registro";
};

const getSecondaryText = (row: Record<string, unknown>): string => {
  const candidates = ["email", "correo_electronico", "telefono", "rol", "estado", "fecha_nacimiento"];
  const values = candidates
    .map((key) => stringify(row[key]).trim())
    .filter(Boolean)
    .slice(0, 2);

  return values.join(" | ");
};

const getInitials = (text: string): string => {
  const parts = text
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "RG";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
};

const AdminSectionDataTable = ({
  seccionActiva,
  columnas,
  filas,
  onViewRow,
  onEditRow,
  onToggleActiveRow,
  onMarkReadRow,
  actionLoadingId = null,
}: AdminSectionDataTableProps) => {
  const schema = getModuleSchema(seccionActiva);
  const columnasVisibles = columnas.filter((col) => isColumnVisible(col, schema));

  if (filas.length === 0) {
    return <p className={styles.emptyText}>No hay datos para esta seccion.</p>;
  }

  const canView = schema.acciones.includes("ver");
  const canEdit = schema.acciones.includes("editar");
  const canDeleteLogical = schema.acciones.includes("eliminar");
  const isNotifications = seccionActiva === "notificaciones";

  return (
    <div className={styles.compactList}>
      {filas.map((row, index) => {
        const rowId = getRecordId(row);
        const status = getRowStatus(row);
        const primary = getPrimaryText(row);
        const secondary = getSecondaryText(row);
        const chips = columnasVisibles
          .filter((col) => !["nombre", "titulo", "email", "correo_electronico", "telefono", "estado", "activo"].includes(col))
          .map((col) => ({
            label: getColumnLabel(col, schema),
            value: stringify(row[col]).trim(),
          }))
          .filter((item) => item.value)
          .slice(0, 3);

        const isLoading = rowId !== null && actionLoadingId === rowId;
        const isRead = Boolean(row.visto);
        return (
          <article
            key={`${index}-${String(row.id ?? index)}`}
            className={`${styles.compactRow} ${status && !status.isActive ? styles.compactRowInactive : ""}`}
            onClick={canView ? () => onViewRow(row) : undefined}
            data-esp32-clickable={canView ? "true" : undefined}
          >
            <div className={styles.rowAvatar}>{getInitials(primary)}</div>

            <div className={styles.rowMain}>
              <p className={styles.rowTitle}>{primary}</p>
              {secondary ? <p className={styles.rowSub}>{secondary}</p> : null}

              <div className={styles.rowMetaChips}>
                {status ? (
                  <span className={`${styles.rowChip} ${status.isActive ? styles.rowChipActive : styles.rowChipInactive}`}>
                    {status.label}
                  </span>
                ) : null}

                {chips.map((chip) => (
                  <span key={`${chip.label}-${chip.value}`} className={styles.rowChip}>
                    {chip.label}: {chip.value}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.rowActions}>
              {canView ? (
                <button
                  type="button"
                  className={styles.actionButtonGhost}
                  data-esp32-clickable="true"
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewRow(row);
                  }}
                >
                  Ver
                </button>
              ) : null}

              {canEdit ? (
                <button
                  type="button"
                  className={styles.actionButtonEdit}
                  data-esp32-clickable="true"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditRow?.(row);
                  }}
                  disabled={!onEditRow}
                >
                  Editar
                </button>
              ) : null}

              {isNotifications ? (
                <button
                  type="button"
                  className={styles.actionButtonSoft}
                  data-esp32-clickable="true"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMarkReadRow?.(row);
                  }}
                  disabled={!onMarkReadRow || isRead || isLoading}
                >
                  {isLoading ? "Marcando..." : isRead ? "Leida" : "Marcar leida"}
                </button>
              ) : null}

              {canDeleteLogical ? (
                <button
                  type="button"
                  className={styles.actionButtonDanger}
                  data-esp32-clickable="true"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleActiveRow?.(row);
                  }}
                  disabled={!onToggleActiveRow || !status || isLoading}
                >
                  {isLoading ? "Guardando..." : status?.isActive ? "Inactivar" : "Activar"}
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default memo(AdminSectionDataTable);
