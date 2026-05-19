"use client";

import dynamic from "next/dynamic";
import styles from "../../styles/PatientLanding.module.css";

type PatientBranchLocationMapProps = {
  branchName: string;
  token: string;
  latitude: number;
  longitude: number;
};

const PatientBranchLocationMapClient = dynamic(() => import("./PatientBranchLocationMapClient"), {
  ssr: false,
  loading: () => <div className={styles.locationMapLoading}>Cargando mapa de la sucursal...</div>,
});

const PatientBranchLocationMap = (props: PatientBranchLocationMapProps) => {
  return <PatientBranchLocationMapClient {...props} />;
};

export default PatientBranchLocationMap;

export type { PatientBranchLocationMapProps };