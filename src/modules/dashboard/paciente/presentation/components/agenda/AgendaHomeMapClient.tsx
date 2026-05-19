"use client";

import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import styles from "../../styles/PatientLanding.module.css";
import type { HomeVisitLimit, PatientAgendaBranch, RouteResult } from "../../../domain/entities/PatientAgenda";

type HomePoint = {
  lat: number;
  lng: number;
};

type AgendaHomeMapClientProps = {
  selectedBranch: PatientAgendaBranch | null;
  limit: HomeVisitLimit | null;
  homePoint: HomePoint | null;
  routeResult: RouteResult | null;
  onPickPoint: (point: HomePoint) => void;
};

const FALLBACK_CENTER: [number, number] = [-17.783327, -63.18214];

const toLatLng = (lat: number, lng: number): [number, number] => [lat, lng];

const ViewportFollower = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 14), {
      duration: 0.9,
    });
  }, [center, map]);

  return null;
};

const PickPointEvents = ({ onPickPoint }: { onPickPoint: (point: HomePoint) => void }) => {
  useMapEvents({
    click: (event) => {
      onPickPoint({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
};

const AgendaHomeMapClient = ({ selectedBranch, limit, homePoint, routeResult, onPickPoint }: AgendaHomeMapClientProps) => {
  const mapCenter: [number, number] = (() => {
    if (homePoint) return toLatLng(homePoint.lat, homePoint.lng);
    if (selectedBranch !== null && selectedBranch?.latitud !== null && selectedBranch?.longitud !== null) {
      return toLatLng(selectedBranch.latitud, selectedBranch.longitud);
    }
    return FALLBACK_CENTER;
  })();

  const branchPoint: [number, number] | null = (() => {
    if (selectedBranch === null || selectedBranch?.latitud === null || selectedBranch?.longitud === null) return null;
    return toLatLng(selectedBranch.latitud , selectedBranch.longitud );
  })();

  const routePath = useMemo<Array<[number, number]>>(() => {
    if (!routeResult) return [];
    return routeResult.ruta.map((point) => [point.lat, point.lng]);
  }, [routeResult]);

  const limitPolygon = useMemo<Array<[number, number]>>(() => {
    if (!limit || !limit.activo) return [];
    return limit.polygon.map((point) => [point.lat, point.lng]);
  }, [limit]);

  const floatingMarkerIcon = useMemo(
    () =>
      L.divIcon({
        className: styles.agendaMapMarkerRoot,
        html: `<div class="${styles.agendaMapMarker3D}"><div class="${styles.agendaMapMarkerPulse}"></div><div class="${styles.agendaMapMarkerCore}"></div></div>`,
        iconSize: [38, 54],
        iconAnchor: [19, 44],
      }),
    [],
  );

  const clinicIcon = useMemo(
    () =>
      L.divIcon({
        className: styles.agendaMapClinicRoot,
        html: `<div class="${styles.agendaMapClinicIcon}">MI</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [],
  );

  return (
    <div className={styles.agendaMapWrapper}>
      <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className={styles.agendaMapContainer}>
        <ViewportFollower center={mapCenter} />
        <PickPointEvents onPickPoint={onPickPoint} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {limitPolygon.length >= 3 ? (
          <Polygon
            positions={limitPolygon}
            pathOptions={{
              color: "#1de9b6",
              fillColor: "#147d75",
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Tooltip sticky>Zona de domicilio habilitada</Tooltip>
          </Polygon>
        ) : null}

        {branchPoint ? (
          <>
            <Marker position={branchPoint} icon={clinicIcon}>
              <Tooltip direction="top" offset={[0, -8]}>
                {selectedBranch?.nombre || "Sucursal"}
              </Tooltip>
            </Marker>
            <Circle
              center={branchPoint}
              radius={100}
              pathOptions={{
                color: "#8fffd8",
                fillColor: "#1de9b6",
                fillOpacity: 0.12,
                weight: 1.5,
              }}
            />
          </>
        ) : null}

        {homePoint ? (
          <Marker
            position={toLatLng(homePoint.lat, homePoint.lng)}
            icon={floatingMarkerIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker;
                const pos = marker.getLatLng();
                onPickPoint({ lat: pos.lat, lng: pos.lng });
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              Tu ubicacion
            </Tooltip>
          </Marker>
        ) : null}

        {routePath.length >= 2 ? (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: "#e0f2f1",
              weight: 4,
              opacity: 0.9,
              lineCap: "round",
            }}
          >
            <Tooltip sticky>
              Ruta calculada con {routeResult?.algoritmo === "a_estrella" ? "A estrella" : "Dijkstra"}
            </Tooltip>
          </Polyline>
        ) : null}
      </MapContainer>

      <p className={styles.agendaMapHint}>
        Haz click en el mapa para marcar tu domicilio o arrastra el marcador 3D para ajustar precision.
      </p>
    </div>
  );
};

export default AgendaHomeMapClient;
