// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Estimate population density based on location (simplified)
// In production, you'd use actual census data or API
export const estimatePopulationDensity = (latitude, longitude) => {
  // Simplified: assume urban areas have higher density
  // This is a placeholder - replace with actual data source
  const urbanThreshold = 0.5; // Adjust based on your region
  
  // Mock calculation - replace with real data
  if (latitude > 20 && latitude < 30) { // Example: India coordinates
    return 0.7; // High density
  }
  return 0.4; // Medium density
};
