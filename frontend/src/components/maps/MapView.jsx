/**
 * MapView Component - OpenStreetMap Integration
 * Uses Leaflet for interactive maps of Indian cities
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getImageUrl } from '../../utils/image.js';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for different severity levels
const createSeverityIcon = (severity) => {
  const color = severity >= 7 ? '#dc2626' : // red - high
    severity >= 4 ? '#f59e0b' : // orange - medium
      '#22c55e'; // green - low

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Worker icon
const workerIcon = L.divIcon({
  className: 'worker-marker',
  html: `<div style="
    background-color: #3b82f6;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  ">👷</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

function MapView({
  center = [28.6139, 77.2090], // Default: Delhi
  zoom = 12,
  complaints = [],
  workers = [],
  onMapClick,
  onMarkerClick,
  showHeatmap = false,

  hotspots = [], // Existing hotspots
  predictions = [], // ML Predicted hotspots
  height = '400px',
  className = ''
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const hotspotsLayerRef = useRef(null);
  const predictionsLayerRef = useRef(null); // New layer

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      // Add OpenStreetMap tile layer (free, no API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Initialize markers layer
      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      hotspotsLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      predictionsLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

      // Add click handler
      if (onMapClick) {
        mapInstanceRef.current.on('click', (e) => {
          onMapClick(e.latlng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add complaint markers
    complaints.forEach((complaint) => {
      if (complaint.location?.coordinates) {
        const [lng, lat] = complaint.location.coordinates;
        const marker = L.marker([lat, lng], {
          icon: createSeverityIcon(complaint.severity || 5)
        });

        // Add popup
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <strong>Complaint #${complaint._id?.slice(-6) || 'N/A'}</strong><br/>
            <strong>Status:</strong> ${complaint.status || 'Pending'}<br/>
            <strong>Severity:</strong> ${complaint.severity || 'N/A'}/10<br/>
            <strong>Address:</strong> ${complaint.address || 'N/A'}<br/>
            ${complaint.imageUrl ? `<img src="${getImageUrl(complaint.imageUrl)}" style="width: 100%; max-width: 180px; margin-top: 8px; border-radius: 4px;" />` : ''}
          </div>
        `);

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(complaint));
        }

        markersLayerRef.current.addLayer(marker);
      }
    });

    // Add worker markers
    workers.forEach((worker) => {
      if (worker.location?.coordinates) {
        const [lng, lat] = worker.location.coordinates;
        const marker = L.marker([lat, lng], { icon: workerIcon });

        marker.bindPopup(`
          <div>
            <strong>Worker: ${worker.employeeId || 'N/A'}</strong><br/>
            <strong>Status:</strong> ${worker.status || 'N/A'}<br/>
            <strong>Tasks Completed:</strong> ${worker.totalComplaintsResolved || 0}
          </div>
        `);

        markersLayerRef.current.addLayer(marker);
      }
    });

    // Add Hotspots (Heatmap visualization)
    if (showHeatmap && typeof mapRef.current.hotspots !== 'undefined') {
      // Note: In a real scenario, we'd pass hotspots as a prop. 
      // For now, let's assume they are passed or fetched.
      // Since the prop 'hotspots' wasn't in original desc, let's look at implementation.
    }
  }, [complaints, workers, onMarkerClick]);

  // Update hotspots
  useEffect(() => {
    if (!mapInstanceRef.current || !hotspotsLayerRef.current) return;

    hotspotsLayerRef.current.clearLayers();

    if (showHeatmap && hotspots.length > 0) {
      hotspots.forEach(hotspot => {
        if (hotspot.lat && hotspot.lng) {
          const circle = L.circle([hotspot.lat, hotspot.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: hotspot.radius || 500
          });

          circle.bindPopup(`
                <div>
                   <strong>🔥 Hotspot: ${hotspot.name || 'Unknown'}</strong><br/>
                   Intensity: High
                </div>
             `);

          hotspotsLayerRef.current.addLayer(circle);
        }
      });
    }
  }, [showHeatmap, hotspots]);

  // Update predictions
  useEffect(() => {
    if (!mapInstanceRef.current || !predictionsLayerRef.current) return;

    predictionsLayerRef.current.clearLayers();

    if (showHeatmap && predictions.length > 0) {
      predictions.forEach(pred => {
        if (pred.location && pred.location.lat && pred.location.lng) {
          const circle = L.circle([pred.location.lat, pred.location.lng], {
            color: '#8b5cf6', // Purple for prediction
            dashArray: '5, 5', // Dashed line
            fillColor: '#a78bfa',
            fillOpacity: 0.3,
            radius: 800
          });

          circle.bindPopup(`
              <div>
                 <strong>🤖 ML Prediction</strong><br/>
                 <strong>Area:</strong> ${pred.area_name}<br/>
                 <strong>Risk:</strong> ${pred.severity}<br/>
                 <strong>Date:</strong> ${pred.date}
              </div>
           `);

          predictionsLayerRef.current.addLayer(circle);
        }
      });
    }
  }, [showHeatmap, predictions]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className={`rounded-lg shadow ${className}`}
    />
  );
}

export default MapView;
