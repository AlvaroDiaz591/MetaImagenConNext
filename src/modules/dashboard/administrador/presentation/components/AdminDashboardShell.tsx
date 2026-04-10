"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GetAdminDashboardSummaryUseCase } from "../../application/usecases/GetAdminDashboardSummaryUseCase";
import { AdminDashboardApiAdapter } from "../../infrastructure/api/AdminDashboardApiAdapter";
import type {
  AdminDashboardSummary,
  AdminPortalData,
} from "../../domain/entities/AdminDashboardSummary";
import AdminKpiCard from "./AdminKpiCard";
import AdminRecentAccessList from "./AdminRecentAccessList";
import AdminQuickActions from "./AdminQuickActions";
import AdminModuleSidebar from "./AdminModuleSidebar";
import AdminPortalToolbar from "./AdminPortalToolbar";
import AdminSectionDataTable from "./AdminSectionDataTable";
import AdminTreatmentsServicesSection from "./treatments/AdminTreatmentsServicesSection";
import AdminRecordDetailDrawer from "./AdminRecordDetailDrawer";
import AdminEsp32ControlPanel from "./AdminEsp32ControlPanel";
import AdminEsp32PointerOverlay from "./AdminEsp32PointerOverlay";
import { useEsp32BlePointerControl } from "../hooks/useEsp32BlePointerControl";
import styles from "../styles/AdminDashboard.module.css";

const AdminDashboardShell = () => {
  const router = useRouter();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [portal, setPortal] = useState<AdminPortalData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updatingData, setUpdatingData] = useState(false);
  const [error, setError] = useState("");
  const [seccion, setSeccion] = useState("users");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recordSeleccionado, setRecordSeleccionado] = useState<Record<string, unknown> | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [recordActionLoadingId, setRecordActionLoadingId] = useState<number | null>(null);
  const [savingEdition, setSavingEdition] = useState(false);
  const [markingAllNotifications, setMarkingAllNotifications] = useState(false);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const hasLoadedDataRef = useRef(false);
  const esp32Controller = useEsp32BlePointerControl();

  const dashboardUseCase = useMemo(() => {
    return new GetAdminDashboardSummaryUseCase(new AdminDashboardApiAdapter());
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("meta_imagen_admin_theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setThemeMode(storedTheme);
    }
  }, []);

  useEffect(() => {
    const token =
      window.localStorage.getItem("meta_imagen_token") ||
      window.sessionStorage.getItem("meta_imagen_token") ||
      "";

    if (!token) {
      router.replace("/login");
      return;
    }

    const run = async () => {
      const isFirstLoad = !hasLoadedDataRef.current;
      if (isFirstLoad) {
        setInitialLoading(true);
      } else {
        setUpdatingData(true);
      }
      setError("");

      try {
        const result = await dashboardUseCase.execute({
          token,
          seccion,
          busqueda,
          pagina,
          porPagina: 20,
        });

        setSummary(result.summary);
        setPortal(result.portal);
        hasLoadedDataRef.current = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "No fue posible cargar el dashboard.";
        setError(message);
        if (
          message.toLowerCase().includes("sesion") ||
          message.toLowerCase().includes("token") ||
          message.toLowerCase().includes("autorizacion") ||
          message.toLowerCase().includes("permisos")
        ) {
          window.localStorage.removeItem("meta_imagen_token");
          window.sessionStorage.removeItem("meta_imagen_token");
          router.replace("/login");
        }
      } finally {
        setInitialLoading(false);
        setUpdatingData(false);
      }
    };

    const timeoutId = window.setTimeout(run, 160);
    return () => window.clearTimeout(timeoutId);
  }, [dashboardUseCase, router, seccion, busqueda, pagina, refreshNonce]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setBusqueda(busquedaInput.trim());
      setPagina(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [busquedaInput]);

  useEffect(() => {
    setPagina(1);
  }, [seccion]);

  const cerrarSesion = useCallback(() => {
    window.localStorage.removeItem("meta_imagen_token");
    window.sessionStorage.removeItem("meta_imagen_token");
    window.localStorage.removeItem("meta_imagen_usuario");
    window.sessionStorage.removeItem("meta_imagen_usuario");
    router.replace("/login");
  }, [router]);

  const alternarTema = useCallback(() => {
    setThemeMode((actual) => {
      const siguiente = actual === "dark" ? "light" : "dark";
      window.localStorage.setItem("meta_imagen_admin_theme", siguiente);
      return siguiente;
    });
  }, []);

  const seccionActiva = portal?.seccionActiva || seccion;
  const canGoNextPage = Boolean(portal?.paginacion?.tieneSiguiente);

  const modulosPortal = useMemo(
    () => {
      const baseModulos = portal?.modulos || [];
      return baseModulos.some((item) => item.id === "esp32_control")
        ? baseModulos
        : [
            ...baseModulos,
            {
              id: "esp32_control",
              titulo: "Control ESP32 BLE",
              icono: "bluetooth",
              color: "#1DE9B6",
              vista: "metricas" as const,
              totalRegistros: 1,
              habilitado: true,
            },
          ];
    },
    [portal?.modulos],
  );

  const moduloActivo = useMemo(
    () => modulosPortal.find((item) => item.id === seccionActiva),
    [modulosPortal, seccionActiva],
  );
  const isEsp32Section = seccionActiva === "esp32_control";
  const isTreatmentsSection = seccionActiva === "tratamientos_servicios";

  const goToNextPage = useCallback(() => {
    if (canGoNextPage) {
      setPagina((current) => current + 1);
    }
  }, [canGoNextPage]);

  const goToPrevPage = useCallback(() => {
    setPagina((current) => Math.max(current - 1, 1));
  }, []);

  const getSessionToken = useCallback((): string => {
    return (
      window.localStorage.getItem("meta_imagen_token") ||
      window.sessionStorage.getItem("meta_imagen_token") ||
      ""
    );
  }, []);

  const getRecordId = useCallback((record: Record<string, unknown>): number | null => {
    const rawId = record.id;
    if (typeof rawId === "number" && Number.isFinite(rawId)) return rawId;
    if (typeof rawId === "string") {
      const parsed = Number(rawId);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }, []);

  const onSelectRecord = useCallback((record: Record<string, unknown>) => {
    setDrawerMode("view");
    setRecordSeleccionado(record);
    setDrawerOpen(true);
  }, []);

  const onEditRecord = useCallback((record: Record<string, unknown>) => {
    setDrawerMode("edit");
    setRecordSeleccionado(record);
    setDrawerOpen(true);
  }, []);

  const onSelectSection = useCallback((sectionId: string) => {
    setSeccion(sectionId);
    setRecordSeleccionado(null);
    setDrawerOpen(false);
  }, []);

  const onToggleRecordStatus = useCallback(async (record: Record<string, unknown>) => {
    const recordId = getRecordId(record);
    if (!recordId) {
      window.alert("No se encontro el identificador del registro.");
      return;
    }

    const token = getSessionToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setRecordActionLoadingId(recordId);
      await dashboardUseCase.cambiarEstadoRegistro({
        token,
        seccion: seccionActiva,
        recordId,
      });
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible cambiar el estado.";
      window.alert(message);
    } finally {
      setRecordActionLoadingId(null);
    }
  }, [dashboardUseCase, getRecordId, getSessionToken, router, seccionActiva]);

  const onSaveRecordEdition = useCallback(async (payload: Record<string, unknown>) => {
    if (!recordSeleccionado) {
      return;
    }

    const recordId = getRecordId(recordSeleccionado);
    if (!recordId) {
      window.alert("No se encontro el identificador del registro.");
      return;
    }

    const token = getSessionToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setSavingEdition(true);
      await dashboardUseCase.actualizarRegistro({
        token,
        seccion: seccionActiva,
        recordId,
        payload,
      });

      setDrawerOpen(false);
      setRecordSeleccionado(null);
      setDrawerMode("view");
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible guardar los cambios.";
      window.alert(message);
    } finally {
      setSavingEdition(false);
    }
  }, [dashboardUseCase, getRecordId, getSessionToken, recordSeleccionado, router, seccionActiva]);

  const onMarkNotificationRead = useCallback(async (record: Record<string, unknown>) => {
    const recordId = getRecordId(record);
    if (!recordId) {
      window.alert("No se encontro el identificador de la notificacion.");
      return;
    }

    const token = getSessionToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setRecordActionLoadingId(recordId);
      await dashboardUseCase.marcarNotificacionLeida({
        token,
        recordId,
      });
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible marcar la notificacion.";
      window.alert(message);
    } finally {
      setRecordActionLoadingId(null);
    }
  }, [dashboardUseCase, getRecordId, getSessionToken, router]);

  const onMarkAllNotificationsRead = useCallback(async () => {
    const token = getSessionToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setMarkingAllNotifications(true);
      await dashboardUseCase.marcarTodasLasNotificacionesLeidas({ token });
      setRefreshNonce((current) => current + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible marcar todas las notificaciones.";
      window.alert(message);
    } finally {
      setMarkingAllNotifications(false);
    }
  }, [dashboardUseCase, getSessionToken, router]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  if (initialLoading) {
    return <main className={styles.statusScreen}>Cargando dashboard...</main>;
  }

  if (error) {
    return <main className={styles.statusScreen}>{error}</main>;
  }

  if (!summary || !portal) {
    return <main className={styles.statusScreen}>No hay datos disponibles.</main>;
  }

  return (
    <main className={`${styles.page} ${themeMode === "dark" ? styles.themeDark : styles.themeLight}`}>
      <header className={styles.header}>
        <div>
          <h1>Dashboard Administrador</h1>
          <p>
            Bienvenido, {summary.usuario.nombreVisible} - {new Date(summary.fechaServidor).toLocaleString("es-BO")}
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.headerNotificationPill}>
            <span className={styles.headerNotificationCount}>{summary.notificaciones.noLeidas}</span>
            <span>Notificaciones sin leer</span>
          </div>

          <button
            type="button"
            className={styles.themeToggleButton}
            onClick={alternarTema}
            aria-label={themeMode === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
            title={themeMode === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          >
            {themeMode === "dark" ? (
              <svg className={styles.themeIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="4.5" fill="currentColor" />
                <path
                  d="M12 1.8V4M12 20v2.2M4 12H1.8M22.2 12H20M5.2 5.2L3.6 3.6M20.4 20.4l-1.6-1.6M18.8 5.2l1.6-1.6M3.6 20.4l1.6-1.6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg className={styles.themeIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M15.3 3.3a8.8 8.8 0 1 0 5.4 15.7 8.3 8.3 0 1 1-5.4-15.7z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          <button type="button" className={styles.logoutButton} onClick={cerrarSesion}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <section className={styles.kpiGrid}>
        {summary.kpis.map((kpi) => (
          <AdminKpiCard key={kpi.id} item={kpi} />
        ))}
      </section>

      <section className={styles.portalGrid}>
        <AdminModuleSidebar
          modulos={modulosPortal}
          seccionActiva={portal.seccionActiva}
          onSelectSection={onSelectSection}
        />

        <article className={styles.panelAnimated}>
          <div className={styles.panelHeaderRow}>
            <h2>{moduloActivo?.titulo || "Modulo"}</h2>
            <p>{moduloActivo?.totalRegistros.toLocaleString("es-BO") || 0} registros totales</p>
          </div>

          {isEsp32Section ? (
            <AdminEsp32ControlPanel controller={esp32Controller} />
          ) : (
            <>
              <AdminPortalToolbar
                busqueda={busquedaInput}
                onBusquedaChange={setBusquedaInput}
                totalRegistros={portal.paginacion.total}
                mensajeVista={portal.vista.mensaje}
                updatingData={updatingData}
                unreadNotifications={summary.notificaciones.noLeidas}
                onMarkAllNotificationsRead={onMarkAllNotificationsRead}
                markingAllNotifications={markingAllNotifications}
                isNotificationsSection={portal.seccionActiva === "notificaciones"}
              />

              {isTreatmentsSection ? (
                <AdminTreatmentsServicesSection
                  filas={portal.filas}
                  onViewRow={onSelectRecord}
                  onToggleActiveRow={onToggleRecordStatus}
                  actionLoadingId={recordActionLoadingId}
                />
              ) : (
                <AdminSectionDataTable
                  seccionActiva={portal.seccionActiva}
                  columnas={portal.columnas}
                  filas={portal.filas}
                  onViewRow={onSelectRecord}
                  onEditRow={onEditRecord}
                  onToggleActiveRow={onToggleRecordStatus}
                  onMarkReadRow={onMarkNotificationRead}
                  actionLoadingId={recordActionLoadingId}
                />
              )}

              <div className={styles.paginationBar}>
                <button type="button" onClick={goToPrevPage} disabled={portal.paginacion.pagina <= 1}>
                  Anterior
                </button>
                <span>
                  Pagina {portal.paginacion.pagina} - Mostrando {portal.filas.length} de {portal.paginacion.total}
                </span>
                <button type="button" onClick={goToNextPage} disabled={!portal.paginacion.tieneSiguiente}>
                  Siguiente
                </button>
              </div>
            </>
          )}
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <h2>Accesos Recientes</h2>
          <AdminRecentAccessList accesos={summary.accesosRecientes} />
        </article>

        <article className={styles.panel}>
          <h2>Acciones Rapidas</h2>
          <AdminQuickActions acciones={summary.accionesRapidas} />
        </article>
      </section>

      <AdminRecordDetailDrawer
        open={drawerOpen}
        seccionActiva={portal.seccionActiva}
        record={recordSeleccionado}
        mode={drawerMode}
        saving={savingEdition}
        onSave={onSaveRecordEdition}
        onClose={closeDrawer}
      />

      <AdminEsp32PointerOverlay controller={esp32Controller} />
    </main>
  );
};

export default AdminDashboardShell;