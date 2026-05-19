"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import styles from "../../styles/AdminDashboard.module.css";

type GeoPoint = {
  lat: number;
  lng: number;
};

type BranchPoint = {
  lat: number;
  lng: number;
  label: string;
};

type AdminLocationsMapClientProps = {
  center: [number, number];
  branchPoint: BranchPoint | null;
  polygon: GeoPoint[];
  polygonEnabled: boolean;
  polygonEditable: boolean;
  onPickPoint?: (point: GeoPoint) => void;
};

const ViewportFollower = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 12), {
      duration: 0.8,
    });
  }, [center, map]);

  return null;
};

const MapClickEvents = ({ onPickPoint }: { onPickPoint?: (point: GeoPoint) => void }) => {
  useMapEvents({
    click: (event) => {
      onPickPoint?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
};

const AdminLocationsMapClient = ({
  center,
  branchPoint,
  polygon,
  polygonEnabled,
  polygonEditable,
  onPickPoint,
}: AdminLocationsMapClientProps) => {
  const branchIcon = useMemo(
    () =>
      L.divIcon({
        className: styles.adminMapMarkerRoot,
        html: `<div class="${styles.adminMapMarkerClinic}">MI</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [],
  );

  const polygonVertexIcon = useMemo(
    () =>
      L.divIcon({
        className: styles.adminMapMarkerRoot,
        html: `<div class="${styles.adminMapPolygonVertex}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    [],
  );

  return (
    <div className={styles.adminMapShell}>
      <MapContainer center={center} zoom={12} scrollWheelZoom className={styles.adminMapCanvas}>
        <ViewportFollower center={center} />
        <MapClickEvents onPickPoint={onPickPoint} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {polygonEnabled && polygon.length >= 3 ? (
          <Polygon
            positions={polygon.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{
              color: "#1de9b6",
              fillColor: "#147d75",
              fillOpacity: 0.24,
              weight: 3,
            }}
          >
            <Tooltip sticky>Geocerca de atención a domicilio</Tooltip>
          </Polygon>
        ) : null}

        {polygon.map((point, index) => (
          <Marker key={`poly-${index}-${point.lat}-${point.lng}`} position={[point.lat, point.lng]} icon={polygonVertexIcon}>
            <Tooltip direction="top" offset={[0, -6]}>
              Punto {index + 1}
            </Tooltip>
          </Marker>
        ))}

        {branchPoint ? (
          <Marker position={[branchPoint.lat, branchPoint.lng]} icon={branchIcon}>
            <Tooltip direction="top" offset={[0, -10]}>
              {branchPoint.label}
            </Tooltip>
          </Marker>
        ) : null}
      </MapContainer>

      <p className={styles.adminMapHint}>
        {polygonEditable
          ? "Haz click para agregar vértices de geocerca."
          : "Haz click para definir la posición de la sucursal en el mapa."}
      </p>
    </div>
  );
};

export type { GeoPoint };
export default AdminLocationsMapClient;
