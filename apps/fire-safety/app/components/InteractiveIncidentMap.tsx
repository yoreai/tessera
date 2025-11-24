"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import type { FireIncident } from "../../../lib/fireData";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

const CATEGORY_COLORS: { [key: string]: string } = {
  "Fire Alarms": "#FF6B6B",
  "Structure Fires": "#8B0000",
  "Outdoor/Brush Fires": "#228B22",
  "Electrical Issues": "#B22222",
  "Vehicle Fires": "#FF4500",
  "Gas Issues": "#FF8C00",
  "Hazmat/CO Issues": "#DC143C",
  "Smoke Investigation": "#708090",
  "Uncategorized Fire": "#CD853F",
};

interface InteractiveIncidentMapProps {
  incidents: FireIncident[];
}

export default function InteractiveIncidentMap({ incidents }: InteractiveIncidentMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-[600px] bg-gray-700/50 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading interactive map...</p>
        </div>
      </div>
    );
  }

  // Sample up to 3000 incidents for performance (like Gradio)
  const sampleSize = Math.min(3000, incidents.length);
  const sampledIncidents = incidents
    .filter(i => i.census_block_group_center__x && i.census_block_group_center__y)
    .slice(0, sampleSize);

  // Calculate center
  const validIncidents = sampledIncidents.filter(
    i => !isNaN(parseFloat(i.census_block_group_center__y)) && !isNaN(parseFloat(i.census_block_group_center__x))
  );

  const centerLat = validIncidents.length > 0
    ? validIncidents.reduce((sum, i) => sum + parseFloat(i.census_block_group_center__y), 0) / validIncidents.length
    : 40.4406;
  const centerLng = validIncidents.length > 0
    ? validIncidents.reduce((sum, i) => sum + parseFloat(i.census_block_group_center__x), 0) / validIncidents.length
    : -79.9959;

  const center: LatLngExpression = [centerLat, centerLng];

  return (
    <div className="relative">
      <div className="h-[600px] rounded-lg overflow-hidden border border-gray-700">
        <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {validIncidents.map((incident, idx) => {
            const lat = parseFloat(incident.census_block_group_center__y);
            const lng = parseFloat(incident.census_block_group_center__x);
            const color = CATEGORY_COLORS[incident.fire_category] || "#CD5C5C";

            return (
              <CircleMarker
                key={idx}
                center={[lat, lng]}
                radius={4}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.7,
                  color: "white",
                  weight: 1,
                  opacity: 0.9,
                }}
              >
                <Popup>
                  <div className="text-gray-900">
                    <strong>{incident.fire_category}</strong>
                    <br />
                    {incident.description_short}
                    <br />
                    City: {incident.city_name}
                    <br />
                    Year: {incident.call_year}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-gray-900/95 border-2 border-gray-600 rounded-lg p-4 text-sm shadow-xl z-[1000] max-w-[200px]">
        <p className="font-bold text-center text-white mb-3 text-base">Fire Incident Types</p>
        <div className="space-y-2">
          {Object.entries(CATEGORY_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center space-x-2">
              <span style={{ color }} className="text-lg">●</span>
              <span className="text-white text-xs">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-gray-400 mt-2">
        Showing {validIncidents.length.toLocaleString()} of {incidents.length.toLocaleString()} incidents
      </p>
    </div>
  );
}

