import type { AdminModuleSchema } from "../shared/moduleSchema";

export const metricsModuleConfig: AdminModuleSchema = {
  id: "metricas",
  titulo: "Metricas y Desempeno",
  columnasOcultas: ["id"],
  etiquetas: {
    modulo: "Modulo",
    registros: "Registros",
  },
  acciones: ["ver"],
};
