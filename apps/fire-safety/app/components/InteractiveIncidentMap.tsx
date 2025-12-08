"use client";

import { useEffect, useState, useId } from "react";
import type { FireIncident } from "../../lib/fireData";
import { CATEGORY_COLORS } from "../../lib/fireData";

interface InteractiveIncidentMapProps {
  incidents: FireIncident[];
}

// Inner component that renders the actual map (loaded dynamically)
function MapInner({ incidents, mapId }: { incidents: FireIncident[]; mapId: string }) {
  const [mapComponents, setMapComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    CircleMarker: any;
    Popup: any;
  } | null>(null);

  useEffect(() => {
    // Dynamic import of react-leaflet components
    import("react-leaflet").then((mod) => {
      setMapComponents({
        MapContainer: mod.MapContainer,
        TileLayer: mod.TileLayer,
        CircleMarker: mod.CircleMarker,
        Popup: mod.Popup,
      });
    });
  }, []);

  if (!mapComponents) {
    return (
      <div className="h-[600px] bg-gray-700/50 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading map components...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = mapComponents;

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
      <div id={mapId} className="h-[600px] rounded-lg overflow-hidden border border-gray-700">
        <MapContainer
          key={mapId}
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

export default function InteractiveIncidentMap({ incidents }: InteractiveIncidentMapProps) {
  const [isClient, setIsClient] = useState(false);
  const mapId = useId();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-[600px] bg-gray-700/50 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading incident map...</p>
        </div>
      </div>
    );
  }

  return <MapInner incidents={incidents} mapId={`map-${mapId}`} />;
}
