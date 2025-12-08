"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { FireIncident } from "../../../lib/fireData";
import { CATEGORY_COLORS } from "../../../lib/fireData";

interface Props {
  incidents: FireIncident[];
}

export default function InteractiveIncidentMapClient({ incidents }: Props) {
  // Sample for performance
  const sampleSize = Math.min(3000, incidents.length);
  const sampleIndices = new Set<number>();
  while (sampleIndices.size < sampleSize && incidents.length > 0) {
    sampleIndices.add(Math.floor(Math.random() * incidents.length));
  }

  const sampledIncidents = Array.from(sampleIndices)
    .map(idx => incidents[idx])
    .filter(i => i?.census_block_group_center__x && i?.census_block_group_center__y);

  // Find center
  const validPoints = sampledIncidents.filter(i => {
    const lat = parseFloat(i.census_block_group_center__y);
    const lng = parseFloat(i.census_block_group_center__x);
    return !isNaN(lat) && !isNaN(lng);
  });

  const centerLat = validPoints.length > 0
    ? validPoints.reduce((sum, i) => sum + parseFloat(i.census_block_group_center__y), 0) / validPoints.length
    : 40.4406;
  const centerLng = validPoints.length > 0
    ? validPoints.reduce((sum, i) => sum + parseFloat(i.census_block_group_center__x), 0) / validPoints.length
    : -79.9959;

  return (
    <div className="relative">
      <div className="h-[600px] rounded-lg overflow-hidden border border-gray-700">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validPoints.map((incident, idx) => {
            const lat = parseFloat(incident.census_block_group_center__y);
            const lng = parseFloat(incident.census_block_group_center__x);
            const color = CATEGORY_COLORS[incident.fire_category] || "#CD5C5C";

            return (
              <CircleMarker
                key={`incident-${idx}`}
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
      <div className="absolute top-4 right-4 bg-gray-900/95 border-2 border-gray-600 rounded-lg p-4 shadow-xl z-[1000]" style={{ minWidth: "180px" }}>
        <p className="font-bold text-white mb-3 text-center text-sm">Fire Incident Types</p>
        <div className="space-y-1">
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2 text-xs text-white">
              <span style={{ color, fontSize: "14px" }}>●</span>
              <span>{category}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-gray-400 mt-2">
        Showing {validPoints.length.toLocaleString()} sampled incidents (of {incidents.length.toLocaleString()} total)
      </p>
    </div>
  );
}

