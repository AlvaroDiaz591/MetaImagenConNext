"use client";

import { useEffect, useMemo, useState } from "react";
import { ManageAdminTreatmentsUseCase } from "@/src/modules/dashboard/administrador/application/usecases/ManageAdminTreatmentsUseCase";
import type { AdminTreatmentItem, AdminTreatmentPayload, AdminTreatmentsBootstrap } from "@/src/modules/dashboard/administrador/domain/entities/AdminTreatment";
import { AdminTreatmentsApiAdapter } from "@/src/modules/dashboard/administrador/infrastructure/api/AdminTreatmentsApiAdapter";

type Params = {
  active: boolean;
  token: string;
};

const EMPTY_BOOTSTRAP: AdminTreatmentsBootstrap = {
  mensaje: "Tratamientos y servicios listos para administrar.",
  servicios: [],
  categorias: [],
  resumen: { total: 0, activos: 0, destacados: 0 },
};

export const useAdminTreatmentsModule = ({ active, token }: Params) => {
  const useCase = useMemo(() => new ManageAdminTreatmentsUseCase(new AdminTreatmentsApiAdapter()), []);

  const [bootstrap, setBootstrap] = useState<AdminTreatmentsBootstrap>(EMPTY_BOOTSTRAP);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [savingEditor, setSavingEditor] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!active || !token) return;
    let cancelled = false;

    setLoading(true);
    setError("");

    void useCase.obtenerBootstrap({ token })
      .then((data) => {
        if (cancelled) return;
        setBootstrap(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "No fue posible cargar tratamientos y servicios.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, token, useCase]);

  const refresh = async () => {
    if (!token) return;
    setRefreshing(true);
    setError("");
    try {
      const data = await useCase.obtenerBootstrap({ token });
      setBootstrap(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar tratamientos y servicios.");
    } finally {
      setRefreshing(false);
    }
  };

  const replaceItem = (nextItem: AdminTreatmentItem) => {
    setBootstrap((current) => {
      const nextItems = [nextItem, ...current.servicios.filter((item) => item.id !== nextItem.id)]
        .sort((left, right) => {
          const featured = Number(right.destacado) - Number(left.destacado);
          if (featured !== 0) return featured;
          const orderDiff = (right.orden || 0) - (left.orden || 0);
          if (orderDiff !== 0) return orderDiff;
          return String(right.actualizadoEn || "").localeCompare(String(left.actualizadoEn || ""));
        });

      const categorias = Array.from(new Set(nextItems.map((item) => item.categoria)));
      return {
        ...current,
        servicios: nextItems,
        categorias,
        resumen: {
          total: nextItems.length,
          activos: nextItems.filter((item) => item.activo).length,
          destacados: nextItems.filter((item) => item.destacado).length,
        },
      };
    });
  };

  const createTreatment = async (payload: AdminTreatmentPayload) => {
    setSavingEditor(true);
    setError("");
    try {
      const item = await useCase.crearServicio({ token, payload });
      replaceItem(item);
      return item;
    } finally {
      setSavingEditor(false);
    }
  };

  const updateTreatment = async (servicioId: number, payload: AdminTreatmentPayload) => {
    setSavingEditor(true);
    setError("");
    try {
      const item = await useCase.actualizarServicio({ token, servicioId, payload });
      replaceItem(item);
      return item;
    } finally {
      setSavingEditor(false);
    }
  };

  const toggleTreatmentStatus = async (servicioId: number, activo: boolean) => {
    setSavingId(servicioId);
    setError("");
    try {
      const item = await useCase.cambiarEstadoServicio({ token, servicioId, activo });
      replaceItem(item);
      return item;
    } finally {
      setSavingId(null);
    }
  };

  return {
    treatments: bootstrap.servicios,
    categories: bootstrap.categorias,
    summary: bootstrap.resumen,
    loading,
    refreshing,
    error,
    savingEditor,
    savingId,
    refresh,
    createTreatment,
    updateTreatment,
    toggleTreatmentStatus,
  };
};