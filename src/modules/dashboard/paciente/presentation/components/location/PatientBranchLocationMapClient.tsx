"use client";

import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { usePatientBranchRoute } from "../../hooks/usePatientBranchRoute";
import styles from "../../styles/PatientLanding.module.css";

type PatientBranchLocationMapClientProps = {
  branchName: string;
  token: string;
  latitude: number;
  longitude: number;
};

const toLatLng = (latitude: number, longitude: number): [number, number] => [latitude, longitude];

const ViewportFollower = ({ center, focusPath }: { center: [number, number]; focusPath: Array<[number, number]> }) => {
  const map = useMap();

  useEffect(() => {
    if (focusPath.length >= 2) {
      map.fitBounds(focusPath, {
        padding: [36, 36],
        maxZoom: 16,
      });
      return;
    }

    map.flyTo(center, Math.max(map.getZoom(), 16), {
      duration: 0.9,
    });
  }, [center, focusPath, map]);

  return null;
};

const WheelZoomCapture = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const nextZoom = event.deltaY < 0 ? map.getZoom() + 1 : map.getZoom() - 1;
      map.setZoom(nextZoom, {
        animate: true,
      });
    };

    map.scrollWheelZoom.disable();
    L.DomEvent.disableClickPropagation(container);
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [map]);

  return null;
};

const PatientBranchLocationMapClient = ({ branchName, token, latitude, longitude }: PatientBranchLocationMapClientProps) => {
  const center = toLatLng(latitude, longitude);
  const { canRequestRoute, homePoint, requestRoute, routeLoading, routePoints } = usePatientBranchRoute({
    token,
    latitude,
    longitude,
  });

  const routePath = useMemo<Array<[number, number]>>(() => {
    return routePoints.map((point) => [point.lat, point.lng]);
  }, [routePoints]);

  const focusPath = useMemo<Array<[number, number]>>(() => {
    if (routePath.length >= 2) {
      return routePath;
    }

    if (homePoint) {
      return [toLatLng(homePoint.lat, homePoint.lng), center];
    }

    return [center];
  }, [center, homePoint, routePath]);

  const clinicIcon = useMemo(
    () =>
      L.divIcon({
        className: styles.locationMapClinicRoot,
        html: `<div class="${styles.locationMapClinic3D}"><span class="${styles.locationMapClinicPulse}"></span><span class="${styles.locationMapClinicBadge}">MI</span></div>`,
        iconSize: [52, 70],
        iconAnchor: [26, 58],
      }),
    [],
  );

  const homeIcon = useMemo(
    () =>
      L.divIcon({
        className: styles.agendaMapMarkerRoot,
        html: `<div class="${styles.agendaMapMarker3D}"><div class="${styles.agendaMapMarkerPulse}"></div><div class="${styles.agendaMapMarkerCore}"></div></div>`,
        iconSize: [38, 54],
        iconAnchor: [19, 44],
      }),
    [],
  );

  return (
    <div className={styles.locationMapShell}>
      <div className={styles.locationMapActions}>
        <button
          type="button"
          className={styles.locationRouteButton}
          onClick={() => {
            void requestRoute();
          }}
          disabled={!canRequestRoute || routeLoading}
        >
          {routeLoading ? "Trazando ruta..." : "Crear ruta desde mi ubicacion"}
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging
        className={styles.locationMapContainer}
      >
        <ViewportFollower center={center} focusPath={focusPath} />
        <WheelZoomCapture />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" />

        {homePoint ? (
          <Marker position={toLatLng(homePoint.lat, homePoint.lng)} icon={homeIcon}>
            <Tooltip direction="top" offset={[0, -10]}>
              Tu ubicacion
            </Tooltip>
          </Marker>
        ) : null}

        <Marker position={center} icon={clinicIcon}>
          <Tooltip direction="top" offset={[0, -18]}>
            {branchName}
          </Tooltip>
        </Marker>

        {routePath.length >= 2 ? (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: "#0d6a49",
              weight: 4.5,
              opacity: 0.92,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ) : null}

        <Circle
          center={center}
          radius={42}
          pathOptions={{
            color: "#8fffd8",
            fillColor: "#24f1a8",
            fillOpacity: 0.14,
            weight: 1.5,
          }}
        />
      </MapContainer>
    </div>
  );
};

export default PatientBranchLocationMapClient;