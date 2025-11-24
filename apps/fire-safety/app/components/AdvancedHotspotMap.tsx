"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import type { FireIncident } from "../../lib/fireData";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

interface AdvancedHotspotMapProps {
  incidents: FireIncident[];
}

export default function AdvancedHotspotMap({ incidents }: AdvancedHotspotMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [HeatmapLayer, setHeatmapLayer] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import heatmap after client loads
    import("react-leaflet-heatmap-layer-v3").then((mod) => {
      setHeatmapLayer(() => mod.default);
    });
  }, []);

  if (!isClient || !HeatmapLayer) {
    return (
      <div className="h-[600px] bg-gray-700/50 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading heatmap...</p>
        </div>
      </div>
    );
  }

  // Aggregate by city for circle markers
  const cityData: { [key: string]: { lat: number; lng: number; count: number } } = {};
  
  incidents.forEach(i => {
    if (i.city_name && i.census_block_group_center__x && i.census_block_group_center__y) {
      if (!cityData[i.city_name]) {
        cityData[i.city_name] = {
          lat: parseFloat(i.census_block_group_center__y),
          lng: parseFloat(i.census_block_group_center__x),
          count: 0,
        };
      }
      cityData[i.city_name].count++;
    }
  });

  const cities = Object.entries(cityData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Prepare heatmap points
  const heatmapPoints = incidents
    .filter(i => i.census_block_group_center__x && i.census_block_group_center__y)
    .slice(0, 5000) // Limit for performance
    .map(i => ({
      lat: parseFloat(i.census_block_group_center__y),
      lng: parseFloat(i.census_block_group_center__x),
      intensity: 1,
    }))
    .filter(p => !isNaN(p.lat) && !isNaN(p.lng));

  const center: LatLngExpression = [40.4406, -79.9959];

  const maxCount = Math.max(...cities.map(c => c.count));

  return (
    <div className="relative">
      <div className="h-[600px] rounded-lg overflow-hidden border border-gray-700">
        <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Heatmap Layer */}
          <HeatmapLayer
            points={heatmapPoints}
            longitudeExtractor={(p: any) => p.lng}
            latitudeExtractor={(p: any) => p.lat}
            intensityExtractor={(p: any) => p.intensity}
            radius={15}
            blur={10}
            max={1}
          />

          {/* City Circle Markers */}
          {cities.map((city, idx) => {
            const radius = Math.log(city.count + 1) * 8;
            const colorIntensity = city.count / maxCount;
            const color = colorIntensity > 0.8 ? "#8B0000" :
                         colorIntensity > 0.6 ? "#DC143C" :
                         colorIntensity > 0.4 ? "#FF4500" :
                         colorIntensity > 0.2 ? "#FF6347" : "#FFA07A";

            return (
              <CircleMarker
                key={idx}
                center={[city.lat, city.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.8,
                  color: "white",
                  weight: 2,
                  opacity: 1,
                }}
              >
                <Popup>
                  <div className="text-gray-900">
                    <strong>{city.name}</strong>
                    <br />
                    Incidents: {city.count.toLocaleString()}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-gray-900/95 border-2 border-gray-600 rounded-lg p-4 shadow-xl z-[1000]">
        <p className="font-bold text-white mb-3">Emergency Risk Level</p>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-32 h-6 bg-gradient-to-r from-red-700 via-orange-500 to-yellow-300 rounded"></div>
        </div>
        <div className="flex justify-between text-xs text-white">
          <span>High</span>
          <span>Low</span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-300">🔥 Bubble size = incident count</p>
        </div>
      </div>
    </div>
  );
}

