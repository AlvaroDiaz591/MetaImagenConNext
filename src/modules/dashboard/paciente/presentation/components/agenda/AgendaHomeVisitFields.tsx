import styles from "../../styles/PatientLanding.module.css";
import type { RouteResult } from "../../../domain/entities/PatientAgenda";
import type { HomeVisitLimit, PatientAgendaBranch } from "../../../domain/entities/PatientAgenda";
import AgendaHomeMap from "./AgendaHomeMap";

type HomePoint = {
  lat: number;
  lng: number;
};

type AgendaHomeVisitFieldsProps = {
  selectedBranch: PatientAgendaBranch | null;
  limit: HomeVisitLimit | null;
  domicilioDireccion: string;
  domicilioReferencia: string;
  homePoint: HomePoint | null;
  homeInsideLimit: boolean;
  geolocationError: string;
  addressLookupError: string;
  locating: boolean;
  resolvingAddress: boolean;
  routeLoading: boolean;
  routeError: string;
  routeResult: RouteResult | null;
  onChangeDireccion: (value: string) => void;
  onChangeReferencia: (value: string) => void;
  onUseCurrentLocation: () => void;
  onClearHomeSelection: () => void;
  onCalculateRoute: () => void;
  onPickPointFromMap: (point: HomePoint) => void;
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
};

const formatDuration = (seconds: number): string => {
  const totalMin = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (!hours) return `${mins} min`;
  return `${hours} h ${mins} min`;
};

const AgendaHomeVisitFields = ({
  selectedBranch,
  limit,
  domicilioDireccion,
  domicilioReferencia,
  homePoint,
  homeInsideLimit,
  geolocationError,
  addressLookupError,
  locating,
  resolvingAddress,
  routeLoading,
  routeError,
  routeResult,
  onChangeDireccion,
  onChangeReferencia,
  onUseCurrentLocation,
  onClearHomeSelection,
  onCalculateRoute,
  onPickPointFromMap,
}: AgendaHomeVisitFieldsProps) => {
  return (
    <div className={styles.agendaHomeBlock}>
      <AgendaHomeMap
        selectedBranch={selectedBranch}
        limit={limit}
        homePoint={homePoint}
        routeResult={routeResult}
        onPickPoint={onPickPointFromMap}
      />

      <div className={styles.agendaHomeActionRow}>
        <button type="button" onClick={onUseCurrentLocation} disabled={locating}>
          {locating ? "Leyendo ubicacion..." : "Usar mi ubicacion actual"}
        </button>
        <button type="button" onClick={onClearHomeSelection}>
          Limpiar
        </button>
      </div>

      {homePoint ? (
        <p className={styles.agendaHintText}>
          Coordenadas: {homePoint.lat.toFixed(6)}, {homePoint.lng.toFixed(6)}
        </p>
      ) : null}

      {!homeInsideLimit ? (
        <p className={styles.agendaErrorText}>Tu ubicacion esta fuera de la geocerca para visitas a domicilio.</p>
      ) : null}
      {geolocationError ? <p className={styles.agendaErrorText}>{geolocationError}</p> : null}
      {addressLookupError ? <p className={styles.agendaErrorText}>{addressLookupError}</p> : null}

      <label className={styles.agendaField}>
        <span>Direccion del domicilio</span>
        <textarea
          rows={2}
          value={domicilioDireccion}
          onChange={(event) => onChangeDireccion(event.target.value)}
          placeholder={resolvingAddress ? "Buscando direccion..." : "Ej. Av. Banzer, condominio X, torre B"}
        />
      </label>

      <label className={styles.agendaField}>
        <span>Referencia</span>
        <input
          type="text"
          value={domicilioReferencia}
          onChange={(event) => onChangeReferencia(event.target.value)}
          placeholder="Ej. Porton negro, piso 3"
        />
      </label>

      <div className={styles.agendaRoutePanel}>
        <button type="button" onClick={onCalculateRoute} disabled={!homePoint || routeLoading}>
          {routeLoading ? "Calculando ruta..." : "Calcular ruta"}
        </button>

        {routeError ? <p className={styles.agendaErrorText}>{routeError}</p> : null}

        {routeResult ? (
          <div className={styles.agendaRouteResult}>
            <strong>
              {routeResult.algoritmo === "a_estrella" ? "A estrella" : "Dijkstra"} • {routeResult.modo === "walking" ? "Caminando" : "Vehiculo"}
            </strong>
            <div className={styles.agendaMetaRow}>
              <span>{formatDistance(routeResult.distanciaMetros)}</span>
              <span>{formatDuration(routeResult.duracionSegundos)}</span>
              <span>{routeResult.nodosVisitados} nodos</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AgendaHomeVisitFields;
