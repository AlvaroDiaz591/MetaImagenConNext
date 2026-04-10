import type { AdminModuleSchema } from "../shared/moduleSchema";

export const kinectModuleConfig: AdminModuleSchema = {
  id: "kinect_postura",
  titulo: "Postura Kinect",
  columnasOcultas: ["id"],
  etiquetas: {
    indicador: "Indicador",
    valor: "Valor",
    estado: "Estado",
  },
  acciones: ["ver"],
};
