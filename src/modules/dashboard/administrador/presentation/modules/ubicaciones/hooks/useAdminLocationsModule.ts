"use client";

import { useEffect, useMemo, useState } from "react";
import { ManageAdminLocationsUseCase } from "@/src/modules/dashboard/administrador/application/usecases/ManageAdminLocationsUseCase";
import type {
  AdminHomeVisitLimit,
  AdminHomeVisitLimitPayload,
  AdminLocationBranch,
  AdminLocationBranchPayload,
  AdminLocationsBootstrap,
} from "@/src/modules/dashboard/administrador/domain/entities/AdminLocation";
import { AdminLocationsApiAdapter } from "@/src/modules/dashboard/administrador/infrastructure/api/AdminLocationsApiAdapter";

type Params = {
  active: boolean;
  token: string;
};

const EMPTY_BOOTSTRAP: AdminLocationsBootstrap = {
  mensaje: "Ubicaciones listas para administrar.",
  sucursales: [],
  limiteDomicilio: null,
  resumen: { total: 0, activas: 0 },
};

export const useAdminLocationsModule = ({ active, token }: Params) => {
  const useCase = useMemo(() => new ManageAdminLocationsUseCase(new AdminLocationsApiAdapter()), []);

  const [bootstrap, setBootstrap] = useState<AdminLocationsBootstrap>(EMPTY_BOOTSTRAP);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [savingBranchId, setSavingBranchId] = useState<number | null>(null);
  const [savingLimit, setSavingLimit] = useState(false);

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
        setError(err instanceof Error ? err.message : "No fue posible cargar las ubicaciones.");
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
      setError(err instanceof Error ? err.message : "No fue posible actualizar las ubicaciones.");
    } finally {
      setRefreshing(false);
    }
  };

  const replaceBranch = (branch: AdminLocationBranch) => {
    setBootstrap((current) => {
      const withoutCurrent = current.sucursales.filter((entry) => entry.id !== branch.id);
      const sucursales = [branch, ...withoutCurrent];
      return {
        ...current,
        sucursales,
        resumen: {
          total: sucursales.length,
          activas: sucursales.filter((entry) => entry.activo).length,
        },
      };
    });
  };

  const createBranch = async (payload: AdminLocationBranchPayload): Promise<AdminLocationBranch> => {
    setSavingBranchId(-1);
    setError("");
    try {
      const branch = await useCase.crearSucursal({ token, payload });
      replaceBranch(branch);
      return branch;
    } finally {
      setSavingBranchId(null);
    }
  };

  const updateBranch = async (branchId: number, payload: AdminLocationBranchPayload): Promise<AdminLocationBranch> => {
    setSavingBranchId(branchId);
    setError("");
    try {
      const branch = await useCase.actualizarSucursal({ token, sucursalId: branchId, payload });
      replaceBranch(branch);
      return branch;
    } finally {
      setSavingBranchId(null);
    }
  };

  const toggleBranchStatus = async (branchId: number, activo: boolean): Promise<AdminLocationBranch> => {
    setSavingBranchId(branchId);
    setError("");
    try {
      const branch = await useCase.cambiarEstadoSucursal({ token, sucursalId: branchId, activo });
      replaceBranch(branch);
      return branch;
    } finally {
      setSavingBranchId(null);
    }
  };

  const saveHomeVisitLimit = async (payload: AdminHomeVisitLimitPayload): Promise<AdminHomeVisitLimit> => {
    setSavingLimit(true);
    setError("");
    try {
      const limit = await useCase.guardarLimiteDomicilio({ token, payload });
      setBootstrap((current) => ({ ...current, limiteDomicilio: limit }));
      return limit;
    } finally {
      setSavingLimit(false);
    }
  };

  return {
    branches: bootstrap.sucursales,
    homeVisitLimit: bootstrap.limiteDomicilio,
    summary: bootstrap.resumen,
    loading,
    refreshing,
    error,
    savingBranchId,
    savingLimit,
    refresh,
    createBranch,
    updateBranch,
    toggleBranchStatus,
    saveHomeVisitLimit,
  };
};