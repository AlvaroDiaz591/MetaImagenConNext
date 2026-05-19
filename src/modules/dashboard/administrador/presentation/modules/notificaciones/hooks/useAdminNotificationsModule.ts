import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ManageAdminNotificationsUseCase } from "@/src/modules/dashboard/administrador/application/usecases/ManageAdminNotificationsUseCase";
import type {
  AdminNotificationFilter,
  AdminNotificationItem,
  AdminNotificationSummary,
} from "@/src/modules/dashboard/administrador/domain/entities/AdminNotification";
import { AdminNotificationsApiAdapter } from "@/src/modules/dashboard/administrador/infrastructure/api/AdminNotificationsApiAdapter";

type UseAdminNotificationsModuleParams = {
  active: boolean;
  token: string;
  onSummaryChange?: (summary: { total: number; noLeidas: number }) => void;
};

const POLLING_MS = 18000;
const PAGE_SIZE = 10;

export const useAdminNotificationsModule = ({ active, token, onSummaryChange }: UseAdminNotificationsModuleParams) => {
  const useCase = useMemo(() => new ManageAdminNotificationsUseCase(new AdminNotificationsApiAdapter()), []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [summary, setSummary] = useState<AdminNotificationSummary>({ total: 0, noLeidas: 0, leidas: 0 });
  const [filter, setFilter] = useState<AdminNotificationFilter>("todas");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [incomingIds, setIncomingIds] = useState<number[]>([]);
  const hasFetchedRef = useRef(false);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const incomingTimeoutRef = useRef<number | null>(null);

  const deferredSearch = useDeferredValue(search.trim());

  const syncSummary = useCallback(
    (nextSummary: AdminNotificationSummary) => {
      setSummary(nextSummary);
      onSummaryChange?.({ total: nextSummary.total, noLeidas: nextSummary.noLeidas });
    },
    [onSummaryChange],
  );

  const requestNotifications = useCallback(
    async (mode: "initial" | "refresh" | "poll") => {
      if (!active || !token.trim()) {
        return;
      }

      if (mode === "initial") {
        setLoading(true);
      }
      if (mode === "refresh") {
        setRefreshing(true);
      }
      setError("");

      try {
        const data = await useCase.listar({
          token,
          query: deferredSearch,
          filter,
          page,
          pageSize: PAGE_SIZE,
        });

        setNotifications(data.items);
        setTotalPages(Math.max(1, Math.ceil((data.paginacion.total || 0) / Math.max(1, data.paginacion.porPagina || PAGE_SIZE))));
        syncSummary(data.resumen);

        if (hasFetchedRef.current) {
          const nextIncoming = data.items
            .filter((item) => !knownIdsRef.current.has(item.id) && !item.visto)
            .map((item) => item.id);

          if (nextIncoming.length) {
            setIncomingIds((current) => Array.from(new Set([...current, ...nextIncoming])));
            if (incomingTimeoutRef.current) {
              window.clearTimeout(incomingTimeoutRef.current);
            }
            incomingTimeoutRef.current = window.setTimeout(() => {
              setIncomingIds([]);
              incomingTimeoutRef.current = null;
            }, 2600);
          }
        }

        knownIdsRef.current = new Set(data.items.map((item) => item.id));
        hasFetchedRef.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible cargar las notificaciones.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [active, token, useCase, deferredSearch, filter, page, syncSummary],
  );

  useEffect(() => {
    if (!active) {
      return;
    }
    void requestNotifications(hasFetchedRef.current ? "refresh" : "initial");
  }, [active, requestNotifications]);

  useEffect(() => {
    if (!active || !token.trim()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void requestNotifications("poll");
    }, POLLING_MS);

    return () => window.clearInterval(intervalId);
  }, [active, token, requestNotifications]);

  useEffect(() => {
    return () => {
      if (incomingTimeoutRef.current) {
        window.clearTimeout(incomingTimeoutRef.current);
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    setMessage("");
    await requestNotifications(hasFetchedRef.current ? "refresh" : "initial");
  }, [requestNotifications]);

  const markRead = useCallback(
    async (notificationId: number) => {
      try {
        setError("");
        setMessage("");
        setMarkingId(notificationId);
        const result = await useCase.marcarLeida({ token, notificationId });
        syncSummary(result.resumen);
        setMessage(result.mensaje);
        setNotifications((current) => current.map((item) => (item.id === notificationId ? result.notificacion : item)));
        await requestNotifications("poll");
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible marcar la notificacion como leida.");
      } finally {
        setMarkingId(null);
      }
    },
    [requestNotifications, syncSummary, token, useCase],
  );

  const markAllRead = useCallback(async () => {
    try {
      setError("");
      setMessage("");
      setMarkingAll(true);
      const result = await useCase.marcarTodasLeidas({ token });
      syncSummary(result.resumen);
      setMessage(result.mensaje);
      setNotifications((current) => current.map((item) => ({ ...item, visto: true })));
      await requestNotifications("poll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible marcar todas las notificaciones.");
    } finally {
      setMarkingAll(false);
    }
  }, [requestNotifications, syncSummary, token, useCase]);

  return {
    loading,
    refreshing,
    notifications,
    summary,
    filter,
    setFilter,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    message,
    error,
    markingId,
    markingAll,
    incomingIds,
    refresh,
    markRead,
    markAllRead,
  };
};
