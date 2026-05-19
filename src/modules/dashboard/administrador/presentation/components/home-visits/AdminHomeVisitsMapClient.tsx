"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import styles from "../../styles/AdminDashboard.module.css";

type HomeVisitRoute = {
  points: Array<[number, number]>;
  distanceMeters: number;
  durationSeconds: number;
  primary: boolean;
};

type HomeVisitPoint = {
  lat: number;
  lng: number;
  label: string;
};

type AdminHomeVisitsMapClientProps = {
  center: [number, number];
  origen: HomeVisitPoint | null;
  destino: HomeVisitPoint | null;
  rutas: HomeVisitRoute[];
  onPickOrigen: (point: { lat: number; lng: number }) => void;
};

const ViewportFollower = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 13), {
      duration: 0.85,
    });
  }, [center, map]);

  return null;
};

const PickOriginEvents = ({ onPickOrigen }: { onPickOrigen: (point: { lat: number; lng: number }) => void }) => {
  useMapEvents({
    click: (event) => {
      onPickOrigen({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters.toFixed(0)} m`;
};

const formatEta = (seconds: number): string => {
  const minutes = seconds / 60;
  if (minutes < 1) return `${seconds.toFixed(0)} s`;
  return `${minutes.toFixed(0)} min`;
};

const AdminHomeVisitsMapClient = ({ center, origen, destino, rutas, onPickOrigen }: AdminHomeVisitsMapClientProps) => {
  const originIcon = useMemo(
    () =>
      L.divIcon({
        className: styles.adminMapMarkerRoot,
        html: `<div class="${styles.adminMapMarkerOrigin}"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [],
  );

  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: styles.adminMapMarkerRoot,
        html: `<div class="${styles.adminMapMarkerDestination}"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [],
  );

  return (
    <div className={styles.adminMapShell}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className={styles.adminMapCanvas}>
        <ViewportFollower center={center} />
        <PickOriginEvents onPickOrigen={onPickOrigen} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {rutas.map((ruta, index) => (
          <Polyline
            key={`ruta-${index}`}
            positions={ruta.points}
            pathOptions={{
              color: ruta.primary ? "#3ef805" : "#ff00c8",
              opacity: ruta.primary ? 0.95 : 0.88,
              weight: ruta.primary ? 5 : 4,
              lineJoin: "round",
              lineCap: "round",
            }}
          >
            <Tooltip sticky>
              {ruta.primary ? "Ruta recomendada" : "Ruta alternativa"} · {formatDistance(ruta.distanceMeters)} · {formatEta(ruta.durationSeconds)}
            </Tooltip>
          </Polyline>
        ))}

        {destino ? (
          <Marker position={[destino.lat, destino.lng]} icon={destinationIcon}>
            <Tooltip direction="top" offset={[0, -10]}>
              {destino.label}
            </Tooltip>
          </Marker>
        ) : null}

        {origen ? (
          <Marker position={[origen.lat, origen.lng]} icon={originIcon}>
            <Tooltip direction="top" offset={[0, -10]}>
              {origen.label}
            </Tooltip>
          </Marker>
        ) : null}
      </MapContainer>

      <div className={styles.adminRouteLegend}>
        <span className={styles.adminRouteLegendPrimary}>Ruta recomendada</span>
        <span className={styles.adminRouteLegendAlternative}>Ruta alternativa</span>
      </div>

      <p className={styles.adminMapHint}>Haz click en el mapa para definir el origen y recalcular la ruta en vivo.</p>
    </div>
  );
};

export type { HomeVisitPoint, HomeVisitRoute };
export default AdminHomeVisitsMapClient;
