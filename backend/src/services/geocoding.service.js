import axios from 'axios';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Helper to delay requests (Nominatim requires 1 request per second max)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let lastRequestTime = 0;

const rateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < 1100) {
    await delay(1100 - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
};

/**
 * Reverse Geocode: Get address from coordinates
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Promise<Object>} Address details
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    await rateLimit();

    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        'accept-language': 'en'
      },
      headers: {
        'User-Agent': 'SwachhCity/1.0'
      }
    });

    if (response.data && response.data.address) {
      const addr = response.data.address;

      // Format address for Indian context
      const city = addr.city || addr.town || addr.village || addr.county || 'Unknown City';
      const state = addr.state || 'Unknown State';
      const pincode = addr.postcode || '';
      const area = addr.suburb || addr.neighbourhood || addr.residential || '';
      const road = addr.road || '';

      const formattedAddress = [road, area, city, state, pincode].filter(Boolean).join(', ');

      return {
        success: true,
        address: formattedAddress || response.data.display_name,
        details: {
          road,
          area,
          city,
          state,
          pincode,
          country: addr.country
        },
        city: city, // Extracted for city logic
        locationImportance: calculateImportance(addr),
        populationDensity: estimatePopulationDensity(city) // Mock estimate
      };
    }

    return {
      success: false,
      message: 'No address found'
    };

  } catch (error) {
    console.error('Geocoding error:', error.message);
    // Fallback to simplistic coords if API fails
    return {
      success: false,
      address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city: 'Unknown'
    };
  }
};

/**
 * Forward Geocode: Get coordinates from address
 * @param {string} query 
 * @param {string} cityContext 
 * @returns {Promise<Object>} Coordinates
 */
export const forwardGeocode = async (query, cityContext = 'India') => {
  try {
    await rateLimit();

    const contextQuery = `${query}, ${cityContext}`;

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: contextQuery,
        format: 'json',
        limit: 1,
        addressdetails: 1,
        countrycodes: 'in'
      },
      headers: {
        'User-Agent': 'SwachhCity/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        success: true,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name
      };
    }

    return {
      success: false,
      message: 'Location not found'
    };

  } catch (error) {
    console.error('Forward geocoding error:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Search Places (Autocomplete)
 * @param {string} query 
 * @param {string} cityContext 
 * @returns {Promise<Array>} List of places
 */
export const searchPlaces = async (query, cityContext) => {
  try {
    await rateLimit();

    const viewbox = getViewboxForCity(cityContext); // Optional: Bias search to city bounds

    const params = {
      q: query,
      format: 'json',
      limit: 5,
      addressdetails: 1,
      countrycodes: 'in'
    };

    // If city context is specific, maybe append it or use viewbox
    // For now simple query appending
    if (cityContext) {
      params.q = `${query} in ${cityContext}`;
    }

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params,
      headers: {
        'User-Agent': 'SwachhCity/1.0'
      }
    });

    if (response.data) {
      return {
        success: true,
        results: response.data.map(item => ({
          name: item.display_name.split(',')[0],
          fullAddress: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }))
      };
    }

    return {
      success: true,
      results: []
    };

  } catch (error) {
    console.error('Search error:', error.message);
    return {
      success: false,
      results: []
    };
  }
};

/**
 * Calculate Location Priority based on POI (Points of Interest)
 * Checks if address is near sensitive areas like schools/hospitals
 */
const calculateImportance = (addressDetails) => {
  // Heuristic: Check if address contains keywords
  // In a real app, this would query OSM for nearby 'amenity=school' etc.

  let score = 0.3; // Base priority

  // High priority keywords (amenities)
  // This is a weak heuristic because address strings might not contain the amenity name if you are just 'near' it.
  // But Nominatim reverse geocode often includes the name of the building if you clicked on it.

  const sensitiveKeywords = ['school', 'college', 'hospital', 'clinic', 'market', 'mall', 'station', 'bus stand'];

  const combinedText = JSON.dumps(addressDetails).toLowerCase();

  for (const keyword of sensitiveKeywords) {
    if (combinedText.includes(keyword)) {
      score = 0.8;
      break;
    }
  }

  return score;
};

const estimatePopulationDensity = (city) => {
  const highDensityCities = ['mumbai', 'delhi', 'kolkata', 'chennai', 'bangalore', 'hyderabad'];
  if (city && highDensityCities.includes(city.toLowerCase())) {
    return 0.8;
  }
  return 0.5;
};

const getViewboxForCity = (city) => {
  // Placeholder for bounding boxes
  return null;
};

export const calculateLocationPriority = async (lat, lng) => {
  // This is just a wrapper for potential future expansion
  // For now, we rely on reverseGeocode results
  return { priority: 0.5 };
};

// Simple JSON dumps helper for keywords check
const JSON = {
  dumps: (obj) => {
    try { return window.JSON.stringify(obj); } catch (e) { return ""; }
  }
};
// Fix the JSON helper which is silly in node, just use global JSON
JSON.dumps = (obj) => global.JSON.stringify(obj);
