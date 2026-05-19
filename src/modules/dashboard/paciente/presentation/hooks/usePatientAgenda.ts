import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AgendaService,
  AppointmentMode,
  HomeVisitLimit,
  PatientAgendaBranch,
  PatientAgendaProfile,
  PatientAppointmentSummary,
  RouteResult,
  SlotsResponse,
} from "../../domain/entities/PatientAgenda";
import { PatientAgendaApiAdapter } from "../../infrastructure/api/PatientAgendaApiAdapter";
import { GetPatientAgendaBootstrapUseCase } from "../../application/usecases/GetPatientAgendaBootstrapUseCase";
import { GetPatientAgendaSlotsUseCase } from "../../application/usecases/GetPatientAgendaSlotsUseCase";
import { CreatePatientAppointmentUseCase } from "../../application/usecases/CreatePatientAppointmentUseCase";
import { ListPatientAppointmentsUseCase } from "../../application/usecases/ListPatientAppointmentsUseCase";
import { CalculatePatientRouteUseCase } from "../../application/usecases/CalculatePatientRouteUseCase";
import { ReverseGeocodePatientPointUseCase } from "../../application/usecases/ReverseGeocodePatientPointUseCase";
import {
  isHomeModeAvailable,
  isPointInsidePolygon,
  validateAppointmentPayload,
} from "../../application/validators/agendaValidators";

type HomePoint = {
  lat: number;
  lng: number;
};

const toDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resolveModeFromService = (service: AgendaService, homeEnabled: boolean): AppointmentMode | null => {
  if (service.disponibleEnClinica) return "clinic";
  if (service.disponibleADomicilio && homeEnabled) return "home";
  return null;
};

export const usePatientAgenda = (params: { token: string; preferredServiceId: number | null }) => {
  const { token, preferredServiceId } = params;

  const api = useMemo(() => new PatientAgendaApiAdapter(), []);
  const bootstrapUseCase = useMemo(() => new GetPatientAgendaBootstrapUseCase(api), [api]);
  const slotsUseCase = useMemo(() => new GetPatientAgendaSlotsUseCase(api), [api]);
  const createUseCase = useMemo(() => new CreatePatientAppointmentUseCase(api), [api]);
  const listUseCase = useMemo(() => new ListPatientAppointmentsUseCase(api), [api]);
  const routeUseCase = useMemo(() => new CalculatePatientRouteUseCase(api), [api]);
  const reverseGeocodeUseCase = useMemo(() => new ReverseGeocodePatientPointUseCase(api), [api]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [profile, setProfile] = useState<PatientAgendaProfile | null>(null);
  const [branches, setBranches] = useState<PatientAgendaBranch[]>([]);
  const [limit, setLimit] = useState<HomeVisitLimit | null>(null);
  const [services, setServices] = useState<AgendaService[]>([]);
  const [appointments, setAppointments] = useState<PatientAppointmentSummary[]>([]);

  const [mode, setMode] = useState<AppointmentMode>("clinic");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const [domicilioDireccion, setDomicilioDireccion] = useState("");
  const [domicilioReferencia, setDomicilioReferencia] = useState("");
  const [homePoint, setHomePoint] = useState<HomePoint | null>(null);
  const [homeInsideLimit, setHomeInsideLimit] = useState(true);
  const [geolocationError, setGeolocationError] = useState("");
  const [addressLookupError, setAddressLookupError] = useState("");
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const [slots, setSlots] = useState<SlotsResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  const slotsCacheRef = useRef<Map<string, SlotsResponse>>(new Map());

  const selectedBranch = useMemo(() => branches.find((branch) => branch.id === selectedBranchId) || null, [branches, selectedBranchId]);
  const homeModeEnabled = useMemo(() => isHomeModeAvailable(limit), [limit]);

  const servicesForMode = useMemo(() => {
    if (mode === "home") {
      return services.filter((service) => service.disponibleADomicilio);
    }
    return services.filter((service) => service.disponibleEnClinica);
  }, [mode, services]);

  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    return services.find((service) => service.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  const loadSlots = useCallback(async (targetDate: string, targetMode: AppointmentMode, force = false) => {
    const cacheKey = `${targetMode}:${targetDate}`;
    if (!force && slotsCacheRef.current.has(cacheKey)) {
      const cached = slotsCacheRef.current.get(cacheKey) || null;
      setSlots(cached);
      if (cached?.slots.some((slot) => slot.time === selectedTime && slot.available && slot.remaining > 0)) {
        return;
      }
      const firstAvailable = cached?.slots.find((slot) => slot.available && slot.remaining > 0);
      setSelectedTime(firstAvailable?.time || null);
      return;
    }

    try {
      setSlotsLoading(true);
      setSlotsError("");
      const response = await slotsUseCase.execute({
        token,
        date: targetDate,
        mode: targetMode,
      });
      slotsCacheRef.current.set(cacheKey, response);
      setSlots(response);

      if (!response.slots.some((slot) => slot.time === selectedTime && slot.available && slot.remaining > 0)) {
        const firstAvailable = response.slots.find((slot) => slot.available && slot.remaining > 0);
        setSelectedTime(firstAvailable?.time || null);
      }
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : "No se pudo consultar disponibilidad.");
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedTime, slotsUseCase, token]);

  const loadAppointments = useCallback(async () => {
    const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    try {
      const list = await listUseCase.execute({ token, from });
      setAppointments(list);
    } catch {
      // Mantener experiencia estable aunque falle el historial.
    }
  }, [listUseCase, token]);

  const initialize = useCallback(async () => {
    if (!token.trim()) {
      setError("Debes iniciar sesion para usar Agenda tu Cita.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const bootstrap = await bootstrapUseCase.execute({ token });

      setProfile(bootstrap.paciente);
      setBranches(bootstrap.sucursales);
      setLimit(bootstrap.limiteDomicilio);
      setServices(bootstrap.servicios);
      setAppointments(bootstrap.citas);

      const firstBranch = bootstrap.sucursales.find((branch) => branch.activo && branch.id) || bootstrap.sucursales[0] || null;
      setSelectedBranchId(firstBranch?.id || null);

      const now = new Date();
      const dateKey = toDateKey(now);
      setSelectedDate(dateKey);

      await loadSlots(dateKey, "clinic", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar la agenda.");
    } finally {
      setLoading(false);
    }
  }, [bootstrapUseCase, loadSlots, token]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!services.length) return;

    if (!preferredServiceId) {
      return;
    }

    const service = services.find((item) => item.id === preferredServiceId);
    if (!service) return;

    const suggestedMode = resolveModeFromService(service, homeModeEnabled);
    if (!suggestedMode) {
      setSubmitError("Este servicio no esta disponible para agenda en este momento.");
      return;
    }

    setSelectedServiceId(service.id);
    if (suggestedMode !== mode) {
      setMode(suggestedMode);
      void loadSlots(selectedDate, suggestedMode, true);
    }
  }, [homeModeEnabled, loadSlots, mode, preferredServiceId, selectedDate, services]);

  useEffect(() => {
    if (!selectedService) return;
    if (mode === "clinic" && selectedService.disponibleEnClinica) return;
    if (mode === "home" && selectedService.disponibleADomicilio) return;

    setSelectedServiceId(null);
  }, [mode, selectedService]);

  const handleChangeMode = useCallback(async (nextMode: AppointmentMode) => {
    if (nextMode === "home" && !homeModeEnabled) {
      setSubmitError("Aun no hay zona de domicilio disponible.");
      return;
    }

    setMode(nextMode);
    setSubmitError("");
    setSuccessMessage("");
    setRouteResult(null);
    await loadSlots(selectedDate, nextMode, true);
  }, [homeModeEnabled, loadSlots, selectedDate]);

  const handleDateChange = useCallback(async (dateValue: string) => {
    setSelectedDate(dateValue);
    setSelectedTime(null);
    setSubmitError("");
    await loadSlots(dateValue, mode, true);
  }, [loadSlots, mode]);

  const handleHomePoint = useCallback((point: HomePoint, shouldReverseGeocode = true) => {
    setHomePoint(point);
    const polygon = limit?.polygon || [];
    setHomeInsideLimit(isPointInsidePolygon(point, polygon));
    setGeolocationError("");
    setAddressLookupError("");

    if (!shouldReverseGeocode) return;

    setResolvingAddress(true);
    void reverseGeocodeUseCase.execute({ token, lat: point.lat, lng: point.lng })
      .then((result) => {
        if (result.direccion.trim()) {
          setDomicilioDireccion(result.direccion.trim());
        }
      })
      .catch((err) => {
        setAddressLookupError(err instanceof Error ? err.message : "No se pudo obtener la direccion.");
      })
      .finally(() => {
        setResolvingAddress(false);
      });
  }, [limit?.polygon, reverseGeocodeUseCase, token]);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocationError("Tu navegador no soporta geolocalizacion.");
      return;
    }

    setLocating(true);
    setGeolocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        handleHomePoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (errorPosition) => {
        setLocating(false);
        if (errorPosition.code === errorPosition.PERMISSION_DENIED) {
          setGeolocationError("Autoriza el acceso a tu ubicacion en el navegador.");
          return;
        }
        setGeolocationError("No pudimos leer tu ubicacion. Intenta nuevamente.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 300_000,
      },
    );
  }, [handleHomePoint]);

  const clearHomeSelection = useCallback(() => {
    setHomePoint(null);
    setHomeInsideLimit(true);
    setDomicilioDireccion("");
    setDomicilioReferencia("");
    setAddressLookupError("");
    setGeolocationError("");
    setRouteResult(null);
    setRouteError("");
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!homePoint) {
      setRouteError("Selecciona una ubicacion para calcular la ruta.");
      return;
    }

    if (!selectedBranch || selectedBranch.latitud === null || selectedBranch.longitud === null) {
      setRouteError("La sucursal seleccionada no tiene coordenadas para calcular ruta.");
      return;
    }

    try {
      setRouteLoading(true);
      setRouteError("");
      const route = await routeUseCase.execute({
        token,
        origenLat: selectedBranch.latitud,
        origenLng: selectedBranch.longitud,
        destinoLat: homePoint.lat,
        destinoLng: homePoint.lng,
        algoritmo: "dijkstra",
        modo: "driving",
      });
      setRouteResult(route);
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : "No fue posible calcular la ruta.");
    } finally {
      setRouteLoading(false);
    }
  }, [homePoint, routeUseCase, selectedBranch, token]);

  const submit = useCallback(async () => {
    if (!profile) {
      setSubmitError("No encontramos tu perfil de paciente.");
      return false;
    }

    const tipo = selectedService?.nombre || "consulta";
    const validationError = validateAppointmentPayload({
      mode,
      date: selectedDate,
      time: selectedTime,
      tipo,
      branchId: selectedBranchId,
      homeModeEnabled,
      homePoint,
      homeInsideLimit,
      domicilioDireccion,
      domicilioReferencia,
      slots,
    });

    if (validationError) {
      setSubmitError(validationError);
      return false;
    }

    try {
      setSaving(true);
      setSubmitError("");
      setSuccessMessage("");

      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const cita = await createUseCase.execute({
        token,
        payload: {
          scheduledAt,
          mode,
          tipo,
          notas: notes.trim() || null,
          sucursalNombre: selectedBranch?.nombre || null,
          domicilioLatitud: mode === "home" ? homePoint?.lat || null : null,
          domicilioLongitud: mode === "home" ? homePoint?.lng || null : null,
          domicilioDireccion: mode === "home" ? domicilioDireccion.trim() : null,
          domicilioReferencia: mode === "home" ? domicilioReferencia.trim() : null,
        },
      });

      setAppointments((current) => [cita, ...current].sort((a, b) => {
        const ta = new Date(a.scheduledAt || "").getTime();
        const tb = new Date(b.scheduledAt || "").getTime();
        return ta - tb;
      }));

      setSuccessMessage("Tu cita fue registrada. Te contactaremos para confirmar.");
      setNotes("");
      if (mode === "home") {
        setRouteResult(null);
      }
      await loadAppointments();
      return true;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo agendar la cita.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    createUseCase,
    domicilioDireccion,
    domicilioReferencia,
    homeInsideLimit,
    homeModeEnabled,
    homePoint,
    loadAppointments,
    mode,
    notes,
    profile,
    selectedBranch,
    selectedBranchId,
    selectedDate,
    selectedService?.nombre,
    selectedTime,
    slots,
    token,
  ]);

  const refresh = useCallback(async () => {
    await initialize();
  }, [initialize]);

  return {
    loading,
    saving,
    error,
    submitError,
    successMessage,

    profile,
    branches,
    limit,
    services,
    appointments,

    mode,
    selectedBranchId,
    selectedDate,
    selectedTime,
    selectedServiceId,
    selectedService,
    servicesForMode,
    notes,

    domicilioDireccion,
    domicilioReferencia,
    homePoint,
    homeInsideLimit,
    geolocationError,
    addressLookupError,
    locating,
    resolvingAddress,

    slots,
    slotsLoading,
    slotsError,

    routeLoading,
    routeError,
    routeResult,

    homeModeEnabled,
    selectedBranch,

    setSelectedBranchId,
    setSelectedTime,
    setSelectedServiceId,
    setNotes,
    setDomicilioDireccion,
    setDomicilioReferencia,
    setSubmitError,
    setSuccessMessage,

    handleChangeMode,
    handleDateChange,
    handleHomePoint,
    useCurrentLocation,
    clearHomeSelection,
    calculateRoute,
    refresh,
    submit,
  };
};
