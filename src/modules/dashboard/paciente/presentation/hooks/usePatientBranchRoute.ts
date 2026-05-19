"use client";

import { useCallback, useMemo, useState } from "react";
import { CalculatePatientRouteUseCase } from "../../application/usecases/CalculatePatientRouteUseCase";
import type { RoutePoint } from "../../domain/entities/PatientAgenda";
import { PatientAgendaApiAdapter } from "../../infrastructure/api/PatientAgendaApiAdapter";

type MapPoint = {
  lat: number;
  lng: number;
};

type UsePatientBranchRouteParams = {
  token: string;
  latitude: number;
  longitude: number;
};

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};

const readCurrentPosition = (): Promise<MapPoint> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("La geolocalizacion no esta disponible en este navegador."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        reject(new Error("No fue posible leer tu ubicacion actual."));
      },
      GEOLOCATION_OPTIONS,
    );
  });
};

export const usePatientBranchRoute = ({ token, latitude, longitude }: UsePatientBranchRouteParams) => {
  const routeUseCase = useMemo(
    () => new CalculatePatientRouteUseCase(new PatientAgendaApiAdapter()),
    [],
  );

  const [homePoint, setHomePoint] = useState<MapPoint | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const canRequestRoute =
    typeof window !== "undefined" && token.trim().length > 0 && Number.isFinite(latitude) && Number.isFinite(longitude) && "geolocation" in navigator;

  const requestRoute = useCallback(async () => {
    if (!canRequestRoute || routeLoading) {
      return;
    }

    setRouteLoading(true);

    try {
      const nextHomePoint = await readCurrentPosition();
      setHomePoint(nextHomePoint);

      const route = await routeUseCase.execute({
        token,
        origenLat: nextHomePoint.lat,
        origenLng: nextHomePoint.lng,
        destinoLat: latitude,
        destinoLng: longitude,
        algoritmo: "a_estrella",
        modo: "driving",
      });

      setRoutePoints(route.ruta);
    } catch {
      setHomePoint(null);
      setRoutePoints([]);
    } finally {
      setRouteLoading(false);
    }
  }, [canRequestRoute, latitude, longitude, routeLoading, routeUseCase, token]);

  return {
    canRequestRoute,
    homePoint,
    routePoints,
    routeLoading,
    requestRoute,
  };
};