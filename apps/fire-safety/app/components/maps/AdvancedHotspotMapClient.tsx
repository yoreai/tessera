"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { FireIncident } from "../../../lib/fireData";

interface Props {
  incidents: FireIncident[];
}

export default function AdvancedHotspotMapClient({ incidents }: Props) {
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
  const minCount = Math.min(...cities.map(c => c.count), 0);

  // Sample points for density visualization
  const densityPoints = incidents
    .filter(i => i.census_block_group_center__x && i.census_block_group_center__y)
    .slice(0, 3000)
    .map(i => ({
      lat: parseFloat(i.census_block_group_center__y),
      lng: parseFloat(i.census_block_group_center__x),
    }))
    .filter(p => !isNaN(p.lat) && !isNaN(p.lng));

  const centerLat = cities.length > 0 ? cities[0].lat : 40.4406;
  const centerLng = cities.length > 0 ? cities[0].lng : -79.9959;

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
          {cities.slice(0, 20).map((city, idx) => {
            const radius = Math.max(6, Math.min(Math.log(city.count + 1) * 3.5, 35));
            const colorIntensity = (city.count - minCount) / (maxCount - minCount);
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
                    <span className="text-lg">{city.name}</span>
                    <br />
                    <span className="font-normal">Fire Incidents: {city.count.toLocaleString()}</span>
                    <br />
                    <span className="text-red-600">{"🔥".repeat(Math.min(5, Math.ceil(colorIntensity * 5) + 1))}</span> Emergency Priority
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-gray-900/95 border-2 border-gray-600 rounded-lg p-4 shadow-xl z-[1000]" style={{ minWidth: "180px" }}>
        <p className="font-bold text-white mb-3 text-center text-sm">Emergency Risk Level</p>
        <div className="mb-2">
          <div className="w-full h-5 bg-gradient-to-r from-red-800 via-orange-500 to-yellow-300 rounded border border-white/20"></div>
        </div>
        <div className="flex justify-between text-xs text-white mb-3">
          <span>High</span>
          <span>Low</span>
        </div>
        <div className="pt-3 border-t border-gray-700 space-y-2 text-xs">
          <div className="flex justify-between text-gray-300">
            <span>🔥 Highest:</span>
            <span className="font-bold text-white">{maxCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>📍 Lowest:</span>
            <span>{minCount.toLocaleString()}</span>
          </div>
          <p className="text-gray-400 text-center pt-2">Bubble size = incident count</p>
        </div>
      </div>

      {/* City labels for high-incident cities */}
      {cities.slice(0, 5).map((city, idx) => (
        <div
          key={`label-${idx}`}
          className="absolute text-xs font-bold text-black bg-white/80 px-1 rounded shadow"
          style={{
            top: `${15 + idx * 5}%`,
            right: "10px",
            zIndex: 1000,
          }}
        >
          {city.name}: {city.count.toLocaleString()}
        </div>
      ))}

      <p className="text-center text-sm text-gray-400 mt-2">
        Municipal density with heat analysis - {incidents.length.toLocaleString()} incidents analyzed
      </p>
    </div>
  );
}

