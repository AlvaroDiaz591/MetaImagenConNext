"use client";

import { useMemo, useState } from "react";
import type { AdminTreatmentCategory, AdminTreatmentItem, AdminTreatmentPayload } from "@/src/modules/dashboard/administrador/domain/entities/AdminTreatment";
import { useAdminTreatmentsModule } from "../hooks/useAdminTreatmentsModule";
import styles from "../styles/AdminTreatmentsSection.module.css";
import AdminTreatmentCard from "./AdminTreatmentCard";
import AdminTreatmentDetailModal from "./AdminTreatmentDetailModal";
import AdminTreatmentEditorModal from "./AdminTreatmentEditorModal";
import AdminTreatmentVideoModal from "./AdminTreatmentVideoModal";

type Props = {
  active: boolean;
  token: string;
  themeMode?: "dark" | "light";
};

const CATEGORY_LABELS: Record<string, string> = {
  todas: "Todas",
  estetica: "Estética",
  kinesiologia: "Fisioterapia / Kinesiología",
};

export default function AdminTreatmentsSection({ active, token, themeMode = "dark" }: Props) {
  const {
    treatments,
    categories,
    summary,
    loading,
    refreshing,
    error: remoteError,
    savingEditor,
    savingId,
    refresh,
    createTreatment,
    updateTreatment,
    toggleTreatmentStatus,
  } = useAdminTreatmentsModule({ active, token });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"todas" | AdminTreatmentCategory>("todas");
  const [onlyActive, setOnlyActive] = useState(true);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [detailItem, setDetailItem] = useState<AdminTreatmentItem | null>(null);
  const [editorItem, setEditorItem] = useState<AdminTreatmentItem | null | undefined>(undefined);
  const [videoItem, setVideoItem] = useState<AdminTreatmentItem | null>(null);
  const [feedback, setFeedback] = useState("");
  const [localError, setLocalError] = useState("");

  const visibleCategories = useMemo(() => ["todas", ...categories], [categories]);

  const filteredTreatments = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    return treatments.filter((item) => {
      if (selectedCategory !== "todas" && item.categoria !== selectedCategory) return false;
      if (onlyActive && !item.activo) return false;
      if (onlyFeatured && !item.destacado) return false;
      if (!normalizedQuery) return true;
      const haystack = [item.nombre, item.descripcion, item.segmento, ...item.tags, ...item.beneficios].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [onlyActive, onlyFeatured, search, selectedCategory, treatments]);

  const effectiveError = localError || remoteError;

  const handleToggle = async (item: AdminTreatmentItem) => {
    if (!window.confirm(`El servicio quedará ${item.activo ? "inactivo" : "activo"}. ¿Deseas continuar?`)) {
      return;
    }

    setLocalError("");
    setFeedback("");
    try {
      const updated = await toggleTreatmentStatus(item.id, !item.activo);
      setFeedback(`Servicio ${updated.activo ? "activado" : "inactivado"} correctamente.`);
      if (detailItem?.id === updated.id) setDetailItem(updated);
      if (editorItem && editorItem.id === updated.id) setEditorItem(updated);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "No fue posible cambiar el estado del servicio.");
    }
  };

  const handleSubmit = async (payload: AdminTreatmentPayload) => {
    setLocalError("");
    setFeedback("");
    try {
      if (editorItem?.id) {
        const updated = await updateTreatment(editorItem.id, payload);
        setEditorItem(undefined);
        setDetailItem(updated);
        setFeedback("Servicio actualizado correctamente.");
        return;
      }
      const created = await createTreatment(payload);
      setEditorItem(undefined);
      setDetailItem(created);
      setFeedback("Servicio creado correctamente.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "No fue posible guardar el servicio.");
      throw err;
    }
  };

  if (loading && !treatments.length) {
    return <p className={styles.emptyText}>Cargando tratamientos y servicios...</p>;
  }

  return (
    <section className={`${styles.root} ${themeMode === "light" ? styles.rootLight : ""}`}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTop}>
            <div>
              <h2 className={styles.heroTitle}>Tratamientos y servicios</h2>
              <p className={styles.heroText}>Administra el catálogo clínico con un editor centrado, tarjetas compactas y acciones rápidas para crear, ver, editar y activar o desactivar cada servicio.</p>
            </div>
            <button type="button" className={styles.heroButton} onClick={() => setEditorItem(null)}>Nuevo servicio</button>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryChip}>{summary.total} registrados</span>
            <span className={styles.summaryChip}>{summary.activos} activos</span>
            <span className={styles.summaryChip}>{summary.destacados} destacados</span>
          </div>
        </div>
      </div>

      <div className={styles.controlsCard}>
        <div className={styles.toolbar}>
          <label className={styles.searchWrap}>
            <input className={styles.searchInput} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, tag o descripción" />
          </label>
          <button type="button" className={styles.softButton} onClick={() => void refresh()} disabled={refreshing}>{refreshing ? "Actualizando..." : "Refresh"}</button>
          <button type="button" className={styles.ghostButton} onClick={() => setOnlyActive((current) => !current)}>{onlyActive ? "Mostrando solo activos" : "Mostrar solo activos"}</button>
          <button type="button" className={styles.ghostButton} onClick={() => setOnlyFeatured((current) => !current)}>{onlyFeatured ? "Mostrando destacados" : "Mostrar destacados"}</button>
        </div>

        <div className={styles.filterRow}>
          {visibleCategories.map((category) => {
            const key = String(category);
            const activeCategory = selectedCategory === category;
            return (
              <button
                key={key}
                type="button"
                className={`${styles.categoryChip} ${activeCategory ? styles.categoryChipActive : ""}`}
                onClick={() => setSelectedCategory(category as "todas" | AdminTreatmentCategory)}
              >
                {CATEGORY_LABELS[key] || key}
              </button>
            );
          })}
        </div>
      </div>

      {feedback ? <p className={styles.successText}>{feedback}</p> : null}
      {effectiveError ? <p className={styles.errorText}>{effectiveError}</p> : null}

      <div className={styles.gridCard}>
        {filteredTreatments.length ? (
          <div className={styles.grid}>
            {filteredTreatments.map((item, index) => (
              <AdminTreatmentCard
                key={item.id}
                item={item}
                index={index}
                loading={savingId === item.id}
                onView={setDetailItem}
                onEdit={setEditorItem}
                onToggle={(target) => void handleToggle(target)}
                onOpenVideo={setVideoItem}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No hay servicios que coincidan con los filtros actuales.</p>
            <button type="button" className={styles.actionPrimary} onClick={() => setEditorItem(null)}>Crear servicio</button>
          </div>
        )}
      </div>

      {detailItem ? (
        <AdminTreatmentDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={(item) => { setDetailItem(null); setEditorItem(item); }}
          onToggle={(item) => void handleToggle(item)}
          onOpenVideo={setVideoItem}
          loading={savingId === detailItem.id}
        />
      ) : null}

      {editorItem !== undefined ? (
        <AdminTreatmentEditorModal
          key={editorItem?.id || "new"}
          item={editorItem || undefined}
          saving={savingEditor}
          onClose={() => setEditorItem(undefined)}
          onSubmit={handleSubmit}
        />
      ) : null}

      {videoItem?.videoUrl ? <AdminTreatmentVideoModal title={videoItem.nombre} url={videoItem.videoUrl} onClose={() => setVideoItem(null)} /> : null}
    </section>
  );
}