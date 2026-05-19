"use client";

import AdminTreatmentsSection from "../../modules/tratamientos_servicios/components/AdminTreatmentsSection";

type AdminTreatmentsServicesSectionProps = {
  active: boolean;
  token: string;
  themeMode?: "dark" | "light";
};

export default function AdminTreatmentsServicesSection({ active, token, themeMode = "dark" }: AdminTreatmentsServicesSectionProps) {
  return <AdminTreatmentsSection active={active} token={token} themeMode={themeMode} />;
}
