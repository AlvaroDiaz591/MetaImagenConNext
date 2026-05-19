import type { AppointmentMode, HomeVisitLimit, SlotsResponse } from "../../domain/entities/PatientAgenda";

export const isPointInsidePolygon = (
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>,
): boolean => {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersects = yi > point.lat !== yj > point.lat
      && point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || 1e-12) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
};

export const isHomeModeAvailable = (limit: HomeVisitLimit | null): boolean => {
  if (!limit) return false;
  return limit.activo && limit.polygon.length >= 3;
};

export const isSlotTimeAvailable = (slots: SlotsResponse | null, time: string | null): boolean => {
  if (!slots || !time) return false;
  const match = slots.slots.find((slot) => slot.time === time);
  return Boolean(match && match.available && match.remaining > 0);
};

export const validateAppointmentPayload = (params: {
  mode: AppointmentMode;
  date: string | null;
  time: string | null;
  tipo: string;
  branchId: number | null;
  homeModeEnabled: boolean;
  homePoint: { lat: number; lng: number } | null;
  homeInsideLimit: boolean;
  domicilioDireccion: string;
  domicilioReferencia: string;
  slots: SlotsResponse | null;
}): string | null => {
  if (!params.date || !params.time) {
    return "Selecciona fecha y hora para continuar.";
  }

  if (!isSlotTimeAvailable(params.slots, params.time)) {
    return "Ese horario ya no esta disponible, elige otro.";
  }

  if (!params.tipo.trim()) {
    return "Selecciona un tratamiento o tipo de cita.";
  }

  const slotDate = new Date(`${params.date}T${params.time}:00`);
  const minAllowed = new Date(Date.now() + 30 * 60 * 1000);
  if (Number.isNaN(slotDate.getTime()) || slotDate < minAllowed) {
    return "El horario debe estar en el futuro.";
  }

  if (params.mode === "clinic") {
    if (!params.branchId) {
      return "Selecciona una sucursal para la atencion en clinica.";
    }
    return null;
  }

  if (!params.homeModeEnabled) {
    return "Aun no hay zona de domicilio disponible.";
  }

  if (!params.homePoint) {
    return "Selecciona una ubicacion para la visita a domicilio.";
  }

  if (!params.homeInsideLimit) {
    return "La ubicacion elegida queda fuera de la zona autorizada.";
  }

  if (params.domicilioDireccion.trim().length < 6 || params.domicilioReferencia.trim().length < 6) {
    return "Completa direccion y referencia para la visita a domicilio.";
  }

  return null;
};
