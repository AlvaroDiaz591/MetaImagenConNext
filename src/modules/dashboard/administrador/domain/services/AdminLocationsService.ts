import type {
  AdminHomeVisitLimit,
  AdminHomeVisitLimitPayload,
  AdminLocationBranch,
  AdminLocationBranchPayload,
  AdminLocationsBootstrap,
} from "../entities/AdminLocation";

export type AdminLocationsAuthParams = {
  token: string;
};

export interface AdminLocationsService {
  obtenerBootstrap(params: AdminLocationsAuthParams): Promise<AdminLocationsBootstrap>;
  crearSucursal(params: AdminLocationsAuthParams & { payload: AdminLocationBranchPayload }): Promise<AdminLocationBranch>;
  actualizarSucursal(
    params: AdminLocationsAuthParams & { sucursalId: number; payload: AdminLocationBranchPayload },
  ): Promise<AdminLocationBranch>;
  cambiarEstadoSucursal(
    params: AdminLocationsAuthParams & { sucursalId: number; activo: boolean },
  ): Promise<AdminLocationBranch>;
  guardarLimiteDomicilio(
    params: AdminLocationsAuthParams & { payload: AdminHomeVisitLimitPayload },
  ): Promise<AdminHomeVisitLimit>;
}