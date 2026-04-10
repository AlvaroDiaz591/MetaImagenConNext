import type { AdminModuleSchema } from "../shared/moduleSchema";

export const attachmentsModuleConfig: AdminModuleSchema = {
  id: "adjuntos",
  titulo: "Adjuntos y Documentos",
  columnasOcultas: ["id"],
  etiquetas: {
    modulo: "Modulo",
    archivo: "Archivo",
    actualizado_en: "Actualizado",
  },
  acciones: ["ver"],
};
