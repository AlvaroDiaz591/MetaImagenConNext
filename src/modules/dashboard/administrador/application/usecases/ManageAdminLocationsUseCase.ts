import type {
  AdminHomeVisitLimit,
  AdminHomeVisitLimitPayload,
  AdminLocationBranch,
  AdminLocationBranchPayload,
  AdminLocationsBootstrap,
} from "../../domain/entities/AdminLocation";
import type { AdminLocationsAuthParams, AdminLocationsService } from "../../domain/services/AdminLocationsService";

export class ManageAdminLocationsUseCase {
  constructor(private readonly service: AdminLocationsService) {}

  obtenerBootstrap(params: AdminLocationsAuthParams): Promise<AdminLocationsBootstrap> {
    return this.service.obtenerBootstrap(params);
  }

  crearSucursal(params: AdminLocationsAuthParams & { payload: AdminLocationBranchPayload }): Promise<AdminLocationBranch> {
    return this.service.crearSucursal(params);
  }

  actualizarSucursal(
    params: AdminLocationsAuthParams & { sucursalId: number; payload: AdminLocationBranchPayload },
  ): Promise<AdminLocationBranch> {
    return this.service.actualizarSucursal(params);
  }

  cambiarEstadoSucursal(
    params: AdminLocationsAuthParams & { sucursalId: number; activo: boolean },
  ): Promise<AdminLocationBranch> {
    return this.service.cambiarEstadoSucursal(params);
  }

  guardarLimiteDomicilio(
    params: AdminLocationsAuthParams & { payload: AdminHomeVisitLimitPayload },
  ): Promise<AdminHomeVisitLimit> {
    return this.service.guardarLimiteDomicilio(params);
  }
}