// Fire safety data service - fetches and processes real data from Vercel Blob
// Replicates Gradio's classification logic for full feature parity

const BLOB_URL = "https://lgn0alpssagu0n2c.public.blob.vercel-storage.com/fire_dispatches_fresh.csv";

// Fire categories ordered consistently with Gradio
export const FIRE_CATEGORIES = [
  "Fire Alarms",
  "Structure Fires",
  "Outdoor/Brush Fires",
  "Electrical Issues",
  "Vehicle Fires",
  "Gas Issues",
  "Hazmat/CO Issues",
  "Smoke Investigation",
  "Uncategorized Fire",
] as const;

// Color scheme matching Gradio's dark theme
export const CATEGORY_COLORS: { [key: string]: string } = {
  "Fire Alarms": "#B85450",
  "Structure Fires": "#A04742",
  "Outdoor/Brush Fires": "#8B6F8B",
  "Electrical Issues": "#B8577A",
  "Vehicle Fires": "#C9746A",
  "Gas Issues": "#7A7BB8",
  "Hazmat/CO Issues": "#6B7B8C",
  "Smoke Investigation": "#8A9BA8",
  "Uncategorized Fire": "#6B7B7B",
};

export interface RawIncident {
  _id: string;
  call_id_hash: string;
  service: string;
  priority: string;
  priority_desc: string;
  call_quarter: string;
  call_year: string;
  description_short: string;
  city_code: string;
  city_name: string;
  geoid: string;
  census_block_group_center__x: string;
  census_block_group_center__y: string;
}

export interface FireIncident extends RawIncident {
  fire_category: string;
  season: string;
}

let cachedData: FireIncident[] | null = null;

/**
 * Classify fire incidents using Gradio's exact logic
 * - Excludes EMS calls
 * - Handles post-2019 "Removed" reclassification for fire alarms
 */
function classifyFireCategory(incident: RawIncident): string | null {
  const desc = incident.description_short || "";
  const year = parseInt(incident.call_year) || 0;

  // Exclude EMS calls (not fire incidents)
  if (desc.includes("EMS")) {
    return null;
  }

  // Exclude traffic incidents
  if (/TRAFFIC/i.test(desc)) {
    return null;
  }

  // CORRECTED FIRE ALARM CLASSIFICATION:
  // Before 2020: Use traditional 'ALARM' incidents
  // After 2019: Use 'Removed' incidents (reclassified alarms)
  const isPreAlarm = year < 2020 && /ALARM/i.test(desc);
  const isPostAlarm = year >= 2020 && desc === "Removed";
  if (isPreAlarm || isPostAlarm) {
    return "Fire Alarms";
  }

  // Structure fires
  if (/DWELLING|STRUCTURE|BUILDING|APARTMENT/i.test(desc)) {
    return "Structure Fires";
  }

  // Outdoor/brush fires
  if (/BRUSH|GRASS|MULCH|OUTSIDE|OUTDOOR|ILLEGAL FIRE/i.test(desc)) {
    return "Outdoor/Brush Fires";
  }

  // Electrical issues
  if (/WIRE|ELECTRICAL|ARCING|TRANSFORMER/i.test(desc)) {
    return "Electrical Issues";
  }

  // Vehicle fires
  if (/VEHICLE|AUTO|CAR/i.test(desc)) {
    return "Vehicle Fires";
  }

  // Gas issues
  if (/GAS|NATURAL GAS/i.test(desc)) {
    return "Gas Issues";
  }

  // Hazmat/CO issues
  if (/HAZMAT|CO OR HAZMAT/i.test(desc)) {
    return "Hazmat/CO Issues";
  }

  // Smoke investigations
  if (/SMOKE.*OUTSIDE|SMOKE.*SEEN|SMOKE.*SMELL|ODOR/i.test(desc)) {
    return "Smoke Investigation";
  }

  // Uncategorized fire
  if (/FIRE UNCATEGORIZED|UNKNOWN TYPE FIRE/i.test(desc)) {
    return "Uncategorized Fire";
  }

  // Exclude other non-fire categories
  if (/MUTUAL AID|RQST ASST|PUBLIC SERVICE|AIRPORT INSPECTION|DETAIL$|LOCKED OUT|CONTAINMENT|CLEAN UP|WATER|FLOOD|RESCUE.*WATER/i.test(desc)) {
    return null;
  }

  // Default: Uncategorized Fire for remaining fire-related
  if (/FIRE/i.test(desc)) {
    return "Uncategorized Fire";
  }

  return null; // Exclude non-fire incidents
}

/**
 * Map quarter to season
 */
function getSeasonFromQuarter(quarter: string): string {
  const seasonMap: { [key: string]: string } = {
    Q1: "Winter",
    Q2: "Spring",
    Q3: "Summer",
    Q4: "Fall",
  };
  return seasonMap[quarter] || "Winter";
}

/**
 * Fetch and process all fire incidents from Vercel Blob
 */
export async function getFireIncidents(): Promise<FireIncident[]> {
  if (cachedData) return cachedData;

  try {
    console.log("Fetching fire incidents from blob storage...");
    const response = await fetch(BLOB_URL);
    const csvText = await response.text();

    const lines = csvText.split("\n");
    const headers = lines[0].split(",").map(h => h.trim());

    const rawIncidents: RawIncident[] = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(",");
        return headers.reduce((obj: any, header, i) => {
          obj[header] = values[i]?.trim() || "";
          return obj;
        }, {});
      });

    // Process and classify incidents
    const fireIncidents: FireIncident[] = [];

    for (const incident of rawIncidents) {
      const category = classifyFireCategory(incident);
      if (category) {
        fireIncidents.push({
          ...incident,
          fire_category: category,
          season: getSeasonFromQuarter(incident.call_quarter),
        });
      }
    }

    console.log(`Processed ${fireIncidents.length} fire incidents from ${rawIncidents.length} raw records`);
    cachedData = fireIncidents;
    return cachedData;
  } catch (error) {
    console.error("Failed to fetch fire data:", error);
    return [];
  }
}

/**
 * Filter incidents by year, type, and city
 */
export function filterIncidents(
  incidents: FireIncident[],
  years: (string | number)[],
  types: (string | number)[],
  cities: (string | number)[]
): FireIncident[] {
  return incidents.filter(incident => {
    const yearMatch = years.length === 0 || years.includes(parseInt(incident.call_year));
    const typeMatch = types.length === 0 || types.includes(incident.fire_category);
    const cityMatch = cities.length === 0 || cities.includes(incident.city_name);
    return yearMatch && typeMatch && cityMatch;
  });
}

/**
 * Aggregate by fire category (for incident distribution bar chart)
 */
export function aggregateByType(incidents: FireIncident[]) {
  const counts: { [key: string]: number } = {};
  incidents.forEach(i => {
    const type = i.fire_category || "Other";
    counts[type] = (counts[type] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Aggregate by year with ALL incident types (for multi-line chart)
 * Returns: [{ year: 2015, "Fire Alarms": 1000, "Structure Fires": 500, ... }, ...]
 */
export function aggregateByYear(incidents: FireIncident[]) {
  const yearData: { [year: string]: { [category: string]: number } } = {};

  incidents.forEach(i => {
    const year = i.call_year;
    const category = i.fire_category;
    if (!year) return;

    if (!yearData[year]) {
      yearData[year] = {};
      FIRE_CATEGORIES.forEach(cat => yearData[year][cat] = 0);
    }
    yearData[year][category] = (yearData[year][category] || 0) + 1;
  });

  return Object.entries(yearData)
    .map(([year, categories]) => ({
      year: parseInt(year),
      ...categories,
    }))
    .sort((a, b) => a.year - b.year);
}

/**
 * Aggregate by season with ALL incident types (for stacked bar chart)
 * Returns: [{ season: "Winter", "Fire Alarms": 1000, "Structure Fires": 500, ... }, ...]
 */
export function aggregateBySeason(incidents: FireIncident[]) {
  const seasonOrder = ["Winter", "Spring", "Summer", "Fall"];
  const seasonData: { [season: string]: { [category: string]: number } } = {};

  // Initialize all seasons
  seasonOrder.forEach(season => {
    seasonData[season] = {};
    FIRE_CATEGORIES.forEach(cat => seasonData[season][cat] = 0);
  });

  incidents.forEach(i => {
    const season = i.season;
    const category = i.fire_category;
    if (seasonData[season]) {
      seasonData[season][category] = (seasonData[season][category] || 0) + 1;
    }
  });

  return seasonOrder.map(season => ({
    season,
    ...seasonData[season],
  }));
}

/**
 * Aggregate by city with ALL incident types (for municipal hotspots stacked bar)
 * Returns top N cities sorted by total incidents
 */
export function aggregateByCity(incidents: FireIncident[], topN: number = 12) {
  const cityData: { [city: string]: { [category: string]: number; total: number } } = {};

  incidents.forEach(i => {
    const city = i.city_name;
    const category = i.fire_category;
    if (!city) return;

    if (!cityData[city]) {
      cityData[city] = { total: 0 };
      FIRE_CATEGORIES.forEach(cat => cityData[city][cat] = 0);
    }
    cityData[city][category] = (cityData[city][category] || 0) + 1;
    cityData[city].total++;
  });

  // Sort by total and take top N
  const sortedCities = Object.entries(cityData)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, topN);

  return sortedCities.map(([city, data]) => {
    const { total, ...categories } = data;
    return { city, ...categories };
  });
}

/**
 * Aggregate by priority level with incident types (for treemap)
 * Returns: [{ priority: "F1", category: "Fire Alarms", count: 1000 }, ...]
 */
export function aggregateByPriority(incidents: FireIncident[]) {
  const priorityData: { priority: string; category: string; count: number }[] = [];
  const counts: { [key: string]: number } = {};

  incidents.forEach(i => {
    const key = `${i.priority_desc}|${i.fire_category}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  Object.entries(counts).forEach(([key, count]) => {
    const [priority, category] = key.split("|");
    priorityData.push({ priority, category, count });
  });

  return priorityData.sort((a, b) => b.count - a.count);
}

/**
 * Aggregate false alarms by type (Commercial, Residential, Other)
 * Replicates Gradio's estimation logic for post-2019 data
 */
export function aggregateFalseAlarms(incidents: FireIncident[]) {
  const alarms = incidents.filter(i => i.fire_category === "Fire Alarms");

  const pre2020 = alarms.filter(i => parseInt(i.call_year) < 2020);
  const post2019 = alarms.filter(i => parseInt(i.call_year) >= 2020);

  // Pre-2020: Use traditional COM/RES breakdown
  const pre2020Com = pre2020.filter(i => i.description_short.includes("COM"));
  const pre2020Res = pre2020.filter(i => i.description_short.includes("RES"));
  const pre2020Other = pre2020.length - pre2020Com.length - pre2020Res.length;

  // Post-2019: Estimate based on historical patterns (60% commercial, 30% residential, 10% other)
  const post2019EstCom = Math.round(post2019.length * 0.6);
  const post2019EstRes = Math.round(post2019.length * 0.3);
  const post2019EstOther = post2019.length - post2019EstCom - post2019EstRes;

  return [
    { name: "Commercial Building Alarms", value: pre2020Com.length + post2019EstCom },
    { name: "Residential Alarms", value: pre2020Res.length + post2019EstRes },
    { name: "Other/Unknown Alarms", value: pre2020Other + post2019EstOther },
  ];
}

/**
 * Calculate key statistics from data
 */
export function calculateStats(incidents: FireIncident[]) {
  const total = incidents.length;
  const years = new Set(incidents.map(i => i.call_year));
  const avgPerYear = Math.round(total / (years.size || 1));

  const structureFires = incidents.filter(i => i.fire_category === "Structure Fires").length;
  const fireAlarms = incidents.filter(i => i.fire_category === "Fire Alarms").length;
  const alarmPercentage = total > 0 ? ((fireAlarms / total) * 100).toFixed(1) : "0";

  const highPriorityIncidents = incidents.filter(i =>
    i.priority === "F1" || i.priority === "Q0"
  ).length;

  return {
    total,
    avgPerYear,
    structureFires,
    fireAlarms,
    alarmPercentage,
    highPriorityIncidents,
  };
}

/**
 * Get unique cities from incidents, sorted by count
 */
export function getTopCities(incidents: FireIncident[], topN: number = 15): string[] {
  const cityCounts: { [key: string]: number } = {};
  incidents.forEach(i => {
    if (i.city_name) {
      cityCounts[i.city_name] = (cityCounts[i.city_name] || 0) + 1;
    }
  });

  return Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([city]) => city);
}
