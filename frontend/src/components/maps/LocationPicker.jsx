/**
 * LocationPicker Component
 * Allows users to pick location on map or use GPS
 * Includes address search with autocomplete
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../lib/api.js';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LocationPicker({
  initialLocation = null,
  onLocationSelect,
  onNearbyReportsFound,
  city = 'Delhi',
  height = '300px',
  showNearby = true
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  const [nearbyComplaints, setNearbyComplaints] = useState([]);

  // City centers for India
  const cityCenters = {
    delhi: [28.6139, 77.2090],
    mumbai: [19.0760, 72.8777],
    bangalore: [12.9716, 77.5946],
    chennai: [13.0827, 80.2707],
    kolkata: [22.5726, 88.3639],
    hyderabad: [17.3850, 78.4867],
  };

  const cityCenter = cityCenters[city.toLowerCase()] || cityCenters.bangalore;

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView(cityCenter, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Click to select location
      mapInstanceRef.current.on('click', async (e) => {
        await handleLocationSelect(e.latlng.lat, e.latlng.lng);
      });

      // Set initial location if provided
      if (initialLocation) {
        updateMarker(initialLocation.lat, initialLocation.lng);
      } else {
        // Try to auto-detect location on mount for better UX
        const gpsTimer = setTimeout(() => {
          if (mapInstanceRef.current) {
            getCurrentLocation();
          }
        }, 1000);
        return () => clearTimeout(gpsTimer);
      }

      // Force a resize event after a slight delay to fix rendering issues
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 500);

      return () => clearTimeout(timer);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position
  const updateMarker = (lat, lng) => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true })
        .addTo(mapInstanceRef.current);

      // Handle marker drag
      markerRef.current.on('dragend', async (e) => {
        const pos = e.target.getLatLng();
        await handleLocationSelect(pos.lat, pos.lng);
      });
    }

    mapInstanceRef.current.setView([lat, lng], 16);
  };

  // Fetch nearby complaints
  useEffect(() => {
    let isMounted = true;
    const fetchNearby = async () => {
      if (!showNearby) return;
      try {
        const response = await api.get('/complaints');
        if (isMounted && response.data?.success) {
          setNearbyComplaints(response.data.data.complaints || []);
        }
      } catch (error) {
        console.error('Failed to fetch nearby complaints:', error);
      }
    };
    fetchNearby();
    return () => { isMounted = false; };
  }, [showNearby]);

  // Update nearby markers
  useEffect(() => {
    if (!mapInstanceRef.current || !showNearby) return;

    // We can use a separate layer for nearby markers
    const nearbyLayer = L.layerGroup().addTo(mapInstanceRef.current);

    nearbyComplaints.forEach(complaint => {
      if (complaint.location?.coordinates) {
        const [lng, lat] = complaint.location.coordinates;

        // Only show if not the selected one (though selected isn't a complaint yet)
        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          fillColor: complaint.status === 'resolved' ? '#22c55e' : '#ef4444',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });

        marker.bindPopup(`
                <div class="text-[10px] font-black uppercase tracking-widest text-gray-800">
                    Existing Report<br/>
                    <span class="text-gray-400">Status: ${complaint.status}</span>
                </div>
            `);

        nearbyLayer.addLayer(marker);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(nearbyLayer);
      }
    };
  }, [nearbyComplaints, showNearby]);

  // Handle location selection
  const handleLocationSelect = async (lat, lng) => {
    setSelectedLocation({ lat, lng });
    updateMarker(lat, lng);

    // Reverse geocode to get address
    try {
      const response = await api.get('/location/reverse-geocode', {
        params: { lat, lng }
      });

      if (response.data.success) {
        setAddress(response.data.address);
        setLocationInfo(response.data);

        // Notify parent
        onLocationSelect({
          lat,
          lng,
          address: response.data.address,
          city: response.data.city,
          locationImportance: response.data.locationImportance,
          populationDensity: response.data.populationDensity
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      onLocationSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    }
  };

  // Get current location using GPS
  const getCurrentLocation = () => {
    setGettingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await handleLocationSelect(position.coords.latitude, position.coords.longitude);
          setGettingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please select on map.');
          setGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
    }
  };

  // Search for addresses
  const searchAddress = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get('/location/search', {
        params: { q: query, city }
      });

      if (response.data.success) {
        setSearchResults(response.data.results.slice(0, 5));
      }
    } catch (error) {
      console.error('Search error:', error);
    }
    setSearching(false);
  }, [city]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddress(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchAddress]);

  // Select search result
  const selectSearchResult = async (result) => {
    setSearchQuery(result.name);
    setSearchResults([]);
    await handleLocationSelect(result.lat, result.lng);
  };

  useEffect(() => {
    if (onNearbyReportsFound) {
      onNearbyReportsFound(nearbyComplaints);
    }
  }, [nearbyComplaints, onNearbyReportsFound]);

  return (
    <div className="space-y-4">
      {/* Search and GPS buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search address or landmark..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  className="w-full px-5 py-4 text-left hover:bg-brand-50 border-b border-gray-50 last:border-b-0 transition-colors group"
                  onClick={() => selectSearchResult(result)}
                >
                  <div className="font-black text-gray-800 text-xs group-hover:text-brand-600 transition-colors">{result.name}</div>
                  <div className="text-[10px] text-gray-400 font-bold truncate mt-0.5">{result.fullAddress}</div>
                </button>
              ))}
            </div>
          )}

          {searching && (
            <div className="absolute right-4 top-3.5">
              <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-800 transition-all active:scale-95 shadow-lg shadow-brand-900/10 disabled:opacity-50"
        >
          {gettingLocation ? (
            <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <span className="text-base leading-none translate-y-[-1px]">📍</span>
          )}
          <span>{gettingLocation ? 'Locating...' : 'Use My GPS'}</span>
        </button>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-2xl border-2 border-gray-100 shadow-inner overflow-hidden relative z-0"
      />

      {/* Selected location info */}
      {selectedLocation && (
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm">
            <strong>Selected Location:</strong>
          </div>
          <div className="text-sm text-gray-600">{address || 'Loading address...'}</div>
          <div className="text-xs text-gray-400 mt-1">
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </div>
          {locationInfo && (
            <div className="mt-2 flex gap-4 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                City: {locationInfo.city || 'Unknown'}
              </span>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Priority: {(locationInfo.locationImportance * 10).toFixed(1)}/10
              </span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Click on the map to select location, or use GPS to auto-detect
      </p>
    </div>
  );
}

export default LocationPicker;
