import type { AdminModuleSchema } from "../shared/moduleSchema";

export const homeVisitsModuleConfig: AdminModuleSchema = {
  id: "visitas_domicilio",
  titulo: "Visitas a Domicilio",
  columnasOcultas: ["id", "paciente_id", "personal_id"],
  etiquetas: {
    scheduled_at: "Fecha preferida",
    estado: "Estado",
    domicilio_direccion: "Direccion",
    domicilio_referencia: "Referencia",
    domicilio_latitud: "Latitud",
    domicilio_longitud: "Longitud",
    actualizado_en: "Actualizado",
  },
  acciones: ["ver"],
};
