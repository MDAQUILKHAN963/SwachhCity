/**
 * Location Routes for Geocoding and City Data
 */

import express from 'express';
import { reverseGeocode, forwardGeocode, searchPlaces, calculateLocationPriority } from '../services/geocoding.service.js';
import { getAllCities, getCityByName, INDIA_CITIES } from '../data/india_cities.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all supported cities
router.get('/cities', (req, res) => {
  try {
    const cities = getAllCities();
    res.json({
      success: true,
      data: {
        cities,
        count: cities.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get city details
router.get('/cities/:name', (req, res) => {
  try {
    const city = getCityByName(req.params.name);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    res.json({
      success: true,
      data: city
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Reverse geocode (coordinates to address)
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng are required'
      });
    }
    
    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Forward geocode (address to coordinates)
router.get('/geocode', async (req, res) => {
  try {
    const { address, city } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'address is required'
      });
    }
    
    const result = await forwardGeocode(address, city || 'Delhi');
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search places (autocomplete)
router.get('/search', async (req, res) => {
  try {
    const { q, city } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'q (query) is required'
      });
    }
    
    const result = await searchPlaces(q, city || 'Delhi');
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Calculate location priority
router.get('/priority', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng are required'
      });
    }
    
    const result = await calculateLocationPriority(parseFloat(lat), parseFloat(lng));
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get important locations for a city (for map overlay)
router.get('/cities/:name/locations', (req, res) => {
  try {
    const city = getCityByName(req.params.name);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        important_locations: city.important_locations,
        garbage_hotspots: city.garbage_hotspots,
        bounds: city.bounds
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
