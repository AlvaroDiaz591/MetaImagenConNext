"use client";

import dynamic from "next/dynamic";
import styles from "../../styles/PatientLanding.module.css";
import type { HomeVisitLimit, PatientAgendaBranch, RouteResult } from "../../../domain/entities/PatientAgenda";

type HomePoint = {
  lat: number;
  lng: number;
};

type AgendaHomeMapProps = {
  selectedBranch: PatientAgendaBranch | null;
  limit: HomeVisitLimit | null;
  homePoint: HomePoint | null;
  routeResult: RouteResult | null;
  onPickPoint: (point: HomePoint) => void;
};

const AgendaHomeMapClient = dynamic(() => import("./AgendaHomeMapClient"), {
  ssr: false,
  loading: () => <div className={styles.agendaMapLoading}>Cargando mapa interactivo...</div>,
});

const AgendaHomeMap = (props: AgendaHomeMapProps) => {
  return <AgendaHomeMapClient {...props} />;
};

export default AgendaHomeMap;
export type { AgendaHomeMapProps };
