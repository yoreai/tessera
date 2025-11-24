"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import type { FireIncident } from "../../../lib/fireData";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

interface AdvancedHotspotMapProps {
  incidents: FireIncident[];
}

export default function AdvancedHotspotMap({ incidents }: AdvancedHotspotMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-[600px] bg-gray-700/50 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading advanced hotspot map...</p>
        </div>
      </div>
    );
  }

  // Aggregate by city
  const cityData: { [key: string]: { lats: number[]; lngs: number[]; count: number } } = {};

  incidents.forEach(i => {
    if (i.city_name && i.census_block_group_center__x && i.census_block_group_center__y) {
      const lat = parseFloat(i.census_block_group_center__y);
      const lng = parseFloat(i.census_block_group_center__x);
      if (!isNaN(lat) && !isNaN(lng)) {
        if (!cityData[i.city_name]) {
          cityData[i.city_name] = { lats: [], lngs: [], count: 0 };
        }
        cityData[i.city_name].lats.push(lat);
        cityData[i.city_name].lngs.push(lng);
        cityData[i.city_name].count++;
      }
    }
  });

  const cities = Object.entries(cityData)
    .map(([name, data]) => ({
      name,
      lat: data.lats.reduce((a, b) => a + b, 0) / data.lats.length,
      lng: data.lngs.reduce((a, b) => a + b, 0) / data.lngs.length,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...cities.map(c => c.count), 1);

  // Sample points for density visualization (like heatmap)
  const densityPoints = incidents
    .filter(i => i.census_block_group_center__x && i.census_block_group_center__y)
    .slice(0, 3000)
    .map(i => ({
      lat: parseFloat(i.census_block_group_center__y),
      lng: parseFloat(i.census_block_group_center__x),
    }))
    .filter(p => !isNaN(p.lat) && !isNaN(p.lng));

  const center: LatLngExpression = cities.length > 0 ? [cities[0].lat, cities[0].lng] : [40.4406, -79.9959];

  return (
    <div className="relative">
      <div className="h-[600px] rounded-lg overflow-hidden border border-gray-700">
        <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Density points (simulating heatmap) */}
          {densityPoints.map((point, idx) => (
            <CircleMarker
              key={`density-${idx}`}
              center={[point.lat, point.lng]}
              radius={3}
              pathOptions={{
                fillColor: "#ff4444",
                fillOpacity: 0.3,
                color: "transparent",
                weight: 0,
              }}
            />
          ))}

          {/* City markers with size by count */}
          {cities.slice(0, 15).map((city, idx) => {
            const radius = Math.log(city.count + 1) * 2.5;
            const colorIntensity = city.count / maxCount;
            const color = colorIntensity > 0.8 ? "#8B0000" :
                         colorIntensity > 0.6 ? "#DC143C" :
                         colorIntensity > 0.4 ? "#FF4500" :
                         colorIntensity > 0.2 ? "#FF6347" : "#FFA07A";

            return (
              <CircleMarker
                key={`city-${idx}`}
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
                  <div className="text-gray-900 font-bold">
                    {city.name}
                    <br />
                    <span className="font-normal">Fire Incidents: {city.count.toLocaleString()}</span>
                    <br />
                    <span className="text-red-600">🔥</span> Emergency Priority
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-gray-900/95 border-2 border-gray-600 rounded-lg p-4 shadow-xl z-[1000]">
        <p className="font-bold text-white mb-3 text-center">Emergency Risk Level</p>
        <div className="mb-2">
          <div className="w-40 h-6 bg-gradient-to-r from-red-700 via-orange-500 to-yellow-300 rounded border border-white/20"></div>
        </div>
        <div className="flex justify-between text-xs text-white mb-3">
          <span>High</span>
          <span>Low</span>
        </div>
        <div className="pt-3 border-t border-gray-700 space-y-1">
          <p className="text-xs text-gray-300">🔥 Bubble size = incident count</p>
          <p className="text-xs text-gray-400">Showing {cities.length} municipalities</p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-400 mt-2">
        Municipal density with heat analysis - {incidents.length.toLocaleString()} incidents analyzed
      </p>
    </div>
  );
}
