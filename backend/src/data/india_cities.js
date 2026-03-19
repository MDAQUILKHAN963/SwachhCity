/**
 * India Cities Database
 * Contains city data, population density, and important locations
 * Starting with Delhi, expandable to all Indian cities
 */

export const INDIA_CITIES = {
  delhi: {
    name: "Delhi",
    fullName: "National Capital Territory of Delhi",
    state: "Delhi",
    country: "India",
    coordinates: {
      lat: 28.6139,
      lng: 77.2090
    },
    bounds: {
      north: 28.8833,
      south: 28.4041,
      east: 77.3534,
      west: 76.8373
    },
    population: 32941000,
    area_sqkm: 1484,
    population_density: 22185, // per sq km
    zones: [
      {
        name: "Central Delhi",
        type: "commercial",
        population_density: "very_high",
        priority_multiplier: 1.5
      },
      {
        name: "New Delhi",
        type: "government",
        population_density: "high",
        priority_multiplier: 1.4
      },
      {
        name: "South Delhi",
        type: "residential",
        population_density: "high",
        priority_multiplier: 1.2
      },
      {
        name: "North Delhi",
        type: "mixed",
        population_density: "very_high",
        priority_multiplier: 1.3
      },
      {
        name: "East Delhi",
        type: "residential",
        population_density: "high",
        priority_multiplier: 1.1
      },
      {
        name: "West Delhi",
        type: "mixed",
        population_density: "medium",
        priority_multiplier: 1.0
      }
    ],
    important_locations: [
      // Hospitals
      { name: "AIIMS Delhi", type: "hospital", lat: 28.5672, lng: 77.2100, priority_boost: 0.3 },
      { name: "Safdarjung Hospital", type: "hospital", lat: 28.5684, lng: 77.2068, priority_boost: 0.3 },
      { name: "GTB Hospital", type: "hospital", lat: 28.6862, lng: 77.3137, priority_boost: 0.3 },
      { name: "RML Hospital", type: "hospital", lat: 28.6271, lng: 77.2049, priority_boost: 0.3 },
      
      // Schools/Universities
      { name: "Delhi University", type: "school", lat: 28.6889, lng: 77.2099, priority_boost: 0.25 },
      { name: "JNU", type: "school", lat: 28.5402, lng: 77.1662, priority_boost: 0.25 },
      { name: "IIT Delhi", type: "school", lat: 28.5458, lng: 77.1926, priority_boost: 0.25 },
      
      // Main Roads/Landmarks
      { name: "Connaught Place", type: "main_road", lat: 28.6315, lng: 77.2167, priority_boost: 0.2 },
      { name: "Chandni Chowk", type: "main_road", lat: 28.6506, lng: 77.2303, priority_boost: 0.2 },
      { name: "India Gate", type: "landmark", lat: 28.6129, lng: 77.2295, priority_boost: 0.2 },
      { name: "Red Fort", type: "landmark", lat: 28.6562, lng: 77.2410, priority_boost: 0.2 },
      
      // Markets (high garbage generation)
      { name: "Sadar Bazar", type: "market", lat: 28.6583, lng: 77.2047, priority_boost: 0.25 },
      { name: "Azadpur Mandi", type: "market", lat: 28.7178, lng: 77.1781, priority_boost: 0.3 },
      { name: "Ghazipur Mandi", type: "market", lat: 28.6291, lng: 77.3275, priority_boost: 0.3 },
    ],
    municipal_wards: 272,
    garbage_hotspots: [
      { name: "Okhla Landfill Area", lat: 28.5278, lng: 77.2686 },
      { name: "Ghazipur Landfill", lat: 28.6230, lng: 77.3267 },
      { name: "Bhalswa Landfill", lat: 28.7488, lng: 77.1611 },
    ]
  },
  
  mumbai: {
    name: "Mumbai",
    fullName: "Greater Mumbai",
    state: "Maharashtra",
    country: "India",
    coordinates: {
      lat: 19.0760,
      lng: 72.8777
    },
    bounds: {
      north: 19.2719,
      south: 18.8928,
      east: 72.9754,
      west: 72.7754
    },
    population: 21297000,
    area_sqkm: 603,
    population_density: 35331,
    zones: [
      { name: "South Mumbai", type: "commercial", population_density: "very_high", priority_multiplier: 1.5 },
      { name: "Central Mumbai", type: "mixed", population_density: "very_high", priority_multiplier: 1.4 },
      { name: "Western Suburbs", type: "residential", population_density: "high", priority_multiplier: 1.2 },
      { name: "Eastern Suburbs", type: "industrial", population_density: "medium", priority_multiplier: 1.1 },
    ],
    important_locations: [
      { name: "CST", type: "landmark", lat: 18.9398, lng: 72.8354, priority_boost: 0.2 },
      { name: "Gateway of India", type: "landmark", lat: 18.9220, lng: 72.8347, priority_boost: 0.2 },
    ],
    municipal_wards: 24,
    garbage_hotspots: [
      { name: "Deonar Landfill", lat: 19.0631, lng: 72.9222 },
    ]
  },
  
  bangalore: {
    name: "Bangalore",
    fullName: "Bengaluru",
    state: "Karnataka",
    country: "India",
    coordinates: {
      lat: 12.9716,
      lng: 77.5946
    },
    bounds: {
      north: 13.1432,
      south: 12.7343,
      east: 77.7689,
      west: 77.3793
    },
    population: 13193000,
    area_sqkm: 741,
    population_density: 17807,
    zones: [
      { name: "Central Bangalore", type: "commercial", population_density: "very_high", priority_multiplier: 1.4 },
      { name: "Whitefield", type: "tech_hub", population_density: "high", priority_multiplier: 1.2 },
      { name: "Electronic City", type: "tech_hub", population_density: "medium", priority_multiplier: 1.2 },
    ],
    important_locations: [
      { name: "MG Road", type: "main_road", lat: 12.9758, lng: 77.6045, priority_boost: 0.2 },
    ],
    municipal_wards: 198,
    garbage_hotspots: []
  },
  
  chennai: {
    name: "Chennai",
    fullName: "Chennai Metropolitan Area",
    state: "Tamil Nadu",
    country: "India",
    coordinates: {
      lat: 13.0827,
      lng: 80.2707
    },
    bounds: {
      north: 13.2344,
      south: 12.9011,
      east: 80.3297,
      west: 80.1768
    },
    population: 11503000,
    area_sqkm: 426,
    population_density: 27003,
    zones: [],
    important_locations: [],
    municipal_wards: 200,
    garbage_hotspots: []
  },
  
  kolkata: {
    name: "Kolkata",
    fullName: "Kolkata Metropolitan Area",
    state: "West Bengal",
    country: "India",
    coordinates: {
      lat: 22.5726,
      lng: 88.3639
    },
    bounds: {
      north: 22.6453,
      south: 22.4547,
      east: 88.4338,
      west: 88.2636
    },
    population: 15134000,
    area_sqkm: 1887,
    population_density: 8021,
    zones: [],
    important_locations: [],
    municipal_wards: 144,
    garbage_hotspots: []
  },
  
  hyderabad: {
    name: "Hyderabad",
    fullName: "Greater Hyderabad",
    state: "Telangana",
    country: "India",
    coordinates: {
      lat: 17.3850,
      lng: 78.4867
    },
    bounds: {
      north: 17.5588,
      south: 17.2148,
      east: 78.6447,
      west: 78.2867
    },
    population: 10534000,
    area_sqkm: 650,
    population_density: 16206,
    zones: [],
    important_locations: [],
    municipal_wards: 150,
    garbage_hotspots: []
  }
};

// Get city by name
export const getCityByName = (name) => {
  const key = name.toLowerCase().replace(/\s+/g, '');
  return INDIA_CITIES[key] || null;
};

// Get all cities list
export const getAllCities = () => {
  return Object.values(INDIA_CITIES).map(city => ({
    name: city.name,
    state: city.state,
    coordinates: city.coordinates
  }));
};

// Check if coordinates are within a city
export const getCityFromCoordinates = (lat, lng) => {
  for (const [key, city] of Object.entries(INDIA_CITIES)) {
    if (
      lat >= city.bounds.south &&
      lat <= city.bounds.north &&
      lng >= city.bounds.west &&
      lng <= city.bounds.east
    ) {
      return city;
    }
  }
  return null;
};

// Calculate location importance based on nearby POIs
export const calculateLocationImportance = (lat, lng, cityName = 'delhi') => {
  const city = getCityByName(cityName);
  if (!city) return 0.5;
  
  let maxBoost = 0;
  
  for (const location of city.important_locations) {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (location.lat - lat) * Math.PI / 180;
    const dLng = (location.lng - lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    // If within 500m of important location, apply boost
    if (distance <= 0.5) {
      maxBoost = Math.max(maxBoost, location.priority_boost);
    } else if (distance <= 1) {
      // Reduced boost for 500m-1km
      maxBoost = Math.max(maxBoost, location.priority_boost * 0.5);
    }
  }
  
  return Math.min(1, 0.5 + maxBoost);
};

// Get population density factor for coordinates
export const getPopulationDensityFactor = (lat, lng, cityName = 'delhi') => {
  const city = getCityByName(cityName);
  if (!city) return 0.5;
  
  // Base density from city data
  const baseDensity = city.population_density;
  
  // Normalize to 0-1 scale (using 50000 as max density reference)
  const normalizedDensity = Math.min(1, baseDensity / 50000);
  
  return normalizedDensity;
};

export default INDIA_CITIES;
