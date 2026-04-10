import type { AdminModuleSchema } from "../shared/moduleSchema";

export const billingModuleConfig: AdminModuleSchema = {
  id: "facturacion_pagos",
  titulo: "Facturacion y Pagos",
  columnasOcultas: ["id", "usuario_id", "paciente_id"],
  etiquetas: {
    estado: "Estado",
    numero_factura: "Factura",
    total: "Total",
    moneda: "Moneda",
    created_at: "Creado",
    updated_at: "Actualizado",
  },
  acciones: ["ver"],
};
