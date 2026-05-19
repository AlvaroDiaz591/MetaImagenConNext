import type { AdminTreatmentItem, AdminTreatmentPayload, AdminTreatmentsBootstrap } from "../entities/AdminTreatment";

export type AdminTreatmentsAuthParams = {
  token: string;
};

export interface AdminTreatmentsService {
  obtenerBootstrap(params: AdminTreatmentsAuthParams): Promise<AdminTreatmentsBootstrap>;
  crearServicio(params: AdminTreatmentsAuthParams & { payload: AdminTreatmentPayload }): Promise<AdminTreatmentItem>;
  actualizarServicio(
    params: AdminTreatmentsAuthParams & { servicioId: number; payload: AdminTreatmentPayload },
  ): Promise<AdminTreatmentItem>;
  cambiarEstadoServicio(
    params: AdminTreatmentsAuthParams & { servicioId: number; activo: boolean },
  ): Promise<AdminTreatmentItem>;
}