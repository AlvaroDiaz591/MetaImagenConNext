"use client";

import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ManageAdminAgendaUseCase } from "@/src/modules/dashboard/administrador/application/usecases/ManageAdminAgendaUseCase";
import type {
  AdminAgendaAppointment,
  AdminAgendaBootstrap,
  AdminAgendaListFilters,
  AdminAgendaPatient,
  AgendaListRange,
  AgendaStatus,
  AgendaTab,
} from "@/src/modules/dashboard/administrador/domain/entities/AdminAgenda";
import { AdminAgendaApiAdapter } from "@/src/modules/dashboard/administrador/infrastructure/api/AdminAgendaApiAdapter";

const DEFAULT_PRESET_TYPES = ["consulta", "control", "procedimiento"];

const toDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTimeInput = (date: Date): string => {
  const minutes = date.getMinutes();
  const rounded = minutes < 30 ? 30 : 0;
  const hourOffset = minutes < 30 ? 0 : 1;
  const next = new Date(date);
  next.setHours(date.getHours() + hourOffset, rounded, 0, 0);
  const hour = String(next.getHours()).padStart(2, "0");
  const minute = String(next.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const buildRange = (
  range: AgendaListRange,
  customFrom: string,
  customTo: string,
): AdminAgendaListFilters => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = new Date(startOfDay);
  let to = new Date(startOfDay);
  to.setHours(23, 59, 59, 999);

  if (range === "semana") {
    from.setDate(startOfDay.getDate() - startOfDay.getDay() + (startOfDay.getDay() === 0 ? -6 : 1));
    to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  }

  if (range === "mes") {
    from = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
    to = new Date(startOfDay.getFullYear(), startOfDay.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  if (range === "personalizado") {
    return {
      from: customFrom ? new Date(`${customFrom}T00:00:00`).toISOString() : undefined,
      to: customTo ? new Date(`${customTo}T23:59:59`).toISOString() : undefined,
    };
  }

  return { from: from.toISOString(), to: to.toISOString() };
};

type UseAdminAgendaModuleParams = {
  active: boolean;
  token: string;
};

export const useAdminAgendaModule = ({ active, token }: UseAdminAgendaModuleParams) => {
  const useCase = useMemo(() => new ManageAdminAgendaUseCase(new AdminAgendaApiAdapter()), []);
  const now = useMemo(() => new Date(), []);

  const [tab, setTab] = useState<AgendaTab>("agendar");
  const [bootstrap, setBootstrap] = useState<AdminAgendaBootstrap | null>(null);
  const [appointments, setAppointments] = useState<AdminAgendaAppointment[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<AdminAgendaAppointment[]>([]);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<AdminAgendaPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<AdminAgendaPatient | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [manualType, setManualType] = useState("");
  const [selectedDate, setSelectedDate] = useState(toDateInput(now));
  const [selectedTime, setSelectedTime] = useState(toTimeInput(now));
  const [notes, setNotes] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<Array<{ personalId: number; rol: string }>>([]);
  const [listRange, setListRange] = useState<AgendaListRange>("hoy");
  const [statusFilter, setStatusFilter] = useState<AgendaStatus | "">("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshingList, setRefreshingList] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const deferredPatientQuery = useDeferredValue(patientQuery.trim());

  const activeServices = useMemo(
    () => (bootstrap?.servicios || []).filter((item) => item.disponibleEnClinica),
    [bootstrap?.servicios],
  );
  const activeStaff = useMemo(
    () => (bootstrap?.personal || []).filter((item) => item.activo && item.estado.toLowerCase() !== "inactivo"),
    [bootstrap?.personal],
  );
  const tipoPresets = bootstrap?.filtros.tiposPredefinidos || DEFAULT_PRESET_TYPES;
  const selectedService = activeServices.find((item) => item.id === selectedServiceId) || null;
  const resolvedType = (selectedService?.nombre || manualType).trim();
  const statusOptions = bootstrap?.filtros.estados || ["pendiente", "confirmada", "cancelada"];

  const getCurrentListFilters = useCallback(
    (): AdminAgendaListFilters => ({
      ...buildRange(listRange, customFrom, customTo),
      status: statusFilter || undefined,
    }),
    [listRange, customFrom, customTo, statusFilter],
  );

  const fetchBootstrap = useCallback(async () => {
    setError("");
    const data = await useCase.obtenerBootstrap(token);
    setBootstrap(data);
    setPatientResults(data.pacientes);
  }, [token, useCase]);

  const fetchAppointments = useCallback(async (
    filters: AdminAgendaListFilters,
    options?: { forPatient?: boolean },
  ) => {
    const result = await useCase.listarCitas(token, filters);
    if (options?.forPatient) {
      setPatientAppointments(result);
      return;
    }
    setAppointments(result);
  }, [token, useCase]);

  useEffect(() => {
    if (!active || !token) return;
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        await fetchBootstrap();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No fue posible cargar la agenda.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [active, token, fetchBootstrap]);

  useEffect(() => {
    if (!active || !token) return;
    let cancelled = false;

    const run = async () => {
      try {
        setRefreshingList(true);
        await fetchAppointments(getCurrentListFilters());
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No fue posible cargar las citas.");
        }
      } finally {
        if (!cancelled) {
          setRefreshingList(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [active, token, fetchAppointments, getCurrentListFilters]);

  useEffect(() => {
    if (!active || !token) return;
    let cancelled = false;

    const run = async () => {
      if (!deferredPatientQuery) {
        setPatientResults(bootstrap?.pacientes || []);
        return;
      }

      try {
        setSearchingPatients(true);
        const result = await useCase.buscarPacientes(token, deferredPatientQuery);
        if (!cancelled) {
          setPatientResults(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No fue posible buscar pacientes.");
        }
      } finally {
        if (!cancelled) {
          setSearchingPatients(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [active, token, useCase, deferredPatientQuery, bootstrap?.pacientes]);

  const selectPatient = async (patient: AdminAgendaPatient) => {
    setSelectedPatient(patient);
    setPatientQuery(patient.fullName);
    setTab("agendar");
    setError("");
    try {
      await fetchAppointments({ patientId: patient.id }, { forPatient: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar las citas del paciente.");
    }
  };

  const toggleStaff = (personalId: number) => {
    setSelectedStaff((current) => {
      const exists = current.some((item) => item.personalId === personalId);
      if (exists) {
        return current.filter((item) => item.personalId !== personalId);
      }
      return [...current, { personalId, rol: "" }];
    });
  };

  const updateStaffRole = (personalId: number, rol: string) => {
    setSelectedStaff((current) =>
      current.map((item) => (item.personalId === personalId ? { ...item, rol } : item)),
    );
  };

  const resetForm = () => {
    setSelectedServiceId(null);
    setManualType("");
    setNotes("");
    setSelectedStaff([]);
    const fresh = new Date();
    setSelectedDate(toDateInput(fresh));
    setSelectedTime(toTimeInput(fresh));
  };

  const submitAppointment = async () => {
    setMessage("");
    setError("");

    if (!selectedPatient?.id) {
      setError("Selecciona un paciente valido.");
      return false;
    }
    if (!resolvedType) {
      setError("Selecciona un servicio o escribe el tipo de atencion.");
      return false;
    }

    try {
      setSaving(true);
      await useCase.crearCita(token, {
        pacienteId: selectedPatient.id,
        scheduledAt: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        tipo: resolvedType,
        notas: notes.trim() || undefined,
        duracionMinutos: selectedService?.duracionMinutos,
        personalAsignado: selectedStaff.map((item) => ({
          personalId: item.personalId,
          rol: item.rol.trim() || undefined,
        })),
      });
      setMessage("Cita agendada correctamente.");
      resetForm();
      await fetchBootstrap();
      await fetchAppointments(getCurrentListFilters());
      if (selectedPatient.id) {
        await fetchAppointments({ patientId: selectedPatient.id }, { forPatient: true });
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible agendar la cita.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changeAppointmentStatus = async (appointmentId: number, status: AgendaStatus) => {
    try {
      setChangingStatusId(appointmentId);
      setMessage("");
      setError("");
      const updated = await useCase.actualizarEstado(token, appointmentId, status);
      setAppointments((current) => current.map((item) => (item.id === appointmentId ? updated : item)));
      setPatientAppointments((current) => current.map((item) => (item.id === appointmentId ? updated : item)));
      setMessage("Estado actualizado.");
      await fetchBootstrap();
      await fetchAppointments(getCurrentListFilters());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar el estado.");
    } finally {
      setChangingStatusId(null);
    }
  };

  const setTabSafe = (nextTab: AgendaTab) => {
    startTransition(() => setTab(nextTab));
  };

  return {
    tab,
    setTab: setTabSafe,
    bootstrap,
    appointments,
    patientAppointments,
    patientQuery,
    setPatientQuery,
    patientResults,
    selectedPatient,
    selectPatient,
    selectedServiceId,
    setSelectedServiceId,
    manualType,
    setManualType,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    notes,
    setNotes,
    selectedStaff,
    toggleStaff,
    updateStaffRole,
    listRange,
    setListRange,
    statusFilter,
    setStatusFilter,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    loading,
    refreshingList,
    searchingPatients,
    saving,
    changingStatusId,
    message,
    error,
    activeServices,
    activeStaff,
    tipoPresets,
    selectedService,
    resolvedType,
    statusOptions,
    submitAppointment,
    changeAppointmentStatus,
  };
};
