"use client";

import dynamic from "next/dynamic";
import type { FireIncident } from "../../lib/fireData";

// Dynamically import the actual map components with SSR disabled
const InteractiveIncidentMapClient = dynamic(
  () => import("./maps/InteractiveIncidentMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-gray-700/50 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading incident map...</p>
        </div>
      </div>
    )
  }
);

const AdvancedHotspotMapClient = dynamic(
  () => import("./maps/AdvancedHotspotMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-gray-700/50 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading hotspot map...</p>
        </div>
      </div>
    )
  }
);

interface MapWrapperProps {
  incidents: FireIncident[];
  mapType: "incidents" | "hotspots";
}

export default function MapWrapper({ incidents, mapType }: MapWrapperProps) {
  if (mapType === "incidents") {
    return <InteractiveIncidentMapClient incidents={incidents} />;
  }
  return <AdvancedHotspotMapClient incidents={incidents} />;
}

