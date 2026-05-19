import type { AdminTreatmentItem, AdminTreatmentPayload, AdminTreatmentsBootstrap } from "../../domain/entities/AdminTreatment";
import type { AdminTreatmentsAuthParams, AdminTreatmentsService } from "../../domain/services/AdminTreatmentsService";

export class ManageAdminTreatmentsUseCase {
  constructor(private readonly service: AdminTreatmentsService) {}

  obtenerBootstrap(params: AdminTreatmentsAuthParams): Promise<AdminTreatmentsBootstrap> {
    return this.service.obtenerBootstrap(params);
  }

  crearServicio(params: AdminTreatmentsAuthParams & { payload: AdminTreatmentPayload }): Promise<AdminTreatmentItem> {
    return this.service.crearServicio(params);
  }

  actualizarServicio(
    params: AdminTreatmentsAuthParams & { servicioId: number; payload: AdminTreatmentPayload },
  ): Promise<AdminTreatmentItem> {
    return this.service.actualizarServicio(params);
  }

  cambiarEstadoServicio(
    params: AdminTreatmentsAuthParams & { servicioId: number; activo: boolean },
  ): Promise<AdminTreatmentItem> {
    return this.service.cambiarEstadoServicio(params);
  }
}