import React, { useMemo, useState } from "react";
import styles from "../styles/AdminDashboard.module.css";
import { getModuleSchema } from "../modules/moduleRegistry";
import { getColumnLabel, isColumnVisible } from "../modules/shared/moduleSchema";

type DrawerMode = "view" | "edit";

type AdminRecordDetailDrawerProps = {
  open: boolean;
  seccionActiva: string;
  record: Record<string, unknown> | null;
  mode?: DrawerMode;
  saving?: boolean;
  onSave?: (payload: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
};

const READ_ONLY_KEYS = ["id", "created_at", "updated_at", "creado_en", "actualizado_en", "fecha_registro"];

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const parseBoolean = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return ["true", "1", "si", "sí", "yes", "activo"].includes(normalized);
};

const AdminRecordDetailDrawer = ({
  open,
  seccionActiva,
  record,
  mode = "view",
  saving = false,
  onSave,
  onClose,
}: AdminRecordDetailDrawerProps) => {
  const safeRecord = record || {};
  const schema = getModuleSchema(seccionActiva);
  const entries = Object.entries(safeRecord).filter(([key]) => isColumnVisible(key, schema));

  const editableKeys = useMemo(() => {
    if (mode !== "edit" || !schema.acciones.includes("editar")) return [];

    return entries
      .map(([key, value]) => ({ key, value }))
      .filter(({ key, value }) => {
        if (READ_ONLY_KEYS.includes(key)) return false;
        if (key.endsWith("_id")) return false;
        const valueType = typeof value;
        return valueType === "string" || valueType === "number" || valueType === "boolean";
      })
      .map((item) => item.key);
  }, [entries, mode, schema.acciones]);

  const initialFormValues = useMemo(() => {
    const nextForm: Record<string, string> = {};
    if (!record) return nextForm;
    for (const key of editableKeys) {
      nextForm[key] = stringifyValue(record[key]);
    }
    return nextForm;
  }, [record, editableKeys]);

  const [formValues, setFormValues] = useState<Record<string, string>>(initialFormValues);

  if (!open || !record) {
    return null;
  }

  const handleChange = (key: string, value: string) => {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!record || !onSave || editableKeys.length === 0) {
      onClose();
      return;
    }

    const payload: Record<string, unknown> = {};

    for (const key of editableKeys) {
      const original = record[key];
      const inputValue = formValues[key] ?? "";

      let parsed: unknown = inputValue;
      if (typeof original === "boolean") {
        parsed = parseBoolean(inputValue);
      } else if (typeof original === "number") {
        const asNumber = Number(inputValue);
        parsed = Number.isFinite(asNumber) ? asNumber : original;
      } else if (key === "estado") {
        parsed = inputValue.trim().toLowerCase() === "inactivo" ? "inactivo" : "activo";
      } else {
        parsed = inputValue.trim();
      }

      if (String(parsed) !== String(original ?? "")) {
        payload[key] = parsed;
      }
    }

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    await onSave(payload);
  };

  return (
    <aside className={styles.drawer}>
      <div className={styles.drawerHeader}>
        <h3>{mode === "edit" ? "Editar registro" : "Detalle del registro"}</h3>
        <div className={styles.drawerHeaderActions}>
          <button type="button" className={styles.drawerButtonGhost} onClick={onClose}>
            {mode === "edit" ? "Cancelar" : "Cerrar"}
          </button>
          {mode === "edit" ? (
            <button type="button" className={styles.drawerButtonPrimary} onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.drawerBody}>
        {entries.map(([key, value]) => {
          const isEditable = mode === "edit" && editableKeys.includes(key);
          const isBoolean = typeof value === "boolean";
          const isEstado = key === "estado";
          const currentValue = formValues[key] ?? stringifyValue(value);

          return (
            <div key={key} className={styles.drawerItem}>
              <p>{getColumnLabel(key, schema)}</p>

              {isEditable ? (
                isBoolean ? (
                  <select
                    className={styles.drawerInput}
                    value={currentValue}
                    onChange={(event) => handleChange(key, event.target.value)}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                ) : isEstado ? (
                  <select
                    className={styles.drawerInput}
                    value={currentValue}
                    onChange={(event) => handleChange(key, event.target.value)}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                ) : (
                  <input
                    className={styles.drawerInput}
                    value={currentValue}
                    onChange={(event) => handleChange(key, event.target.value)}
                  />
                )
              ) : (
                <strong>{value === null || value === undefined || value === "" ? "-" : String(value)}</strong>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default AdminRecordDetailDrawer;
