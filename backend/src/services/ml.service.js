import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Call ML service for garbage detection
export const detectGarbage = async (imagePath) => {
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    const formData = new FormData();
    
    formData.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(
      `${ML_SERVICE_URL}/api/detect`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    return {
      success: true,
      detected: response.data.detected || false,
      confidence: response.data.confidence || 0,
      severity: response.data.severity || 0,
      garbageType: response.data.garbageType || 'unknown',
      boundingBoxes: response.data.bounding_boxes || []
    };
  } catch (error) {
    console.error('ML Service Error:', error.message);
    
    // Fallback: if ML service is not available, return default values
    // In production, you might want to reject the complaint or queue it for later processing
    return {
      success: false,
      detected: true, // Assume garbage is present if ML service fails
      confidence: 0.5,
      severity: 5,
      garbageType: 'unknown',
      boundingBoxes: [],
      error: error.message
    };
  }
};

// Calculate severity score
export const calculateSeverity = async (imagePath) => {
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    const formData = new FormData();
    
    formData.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(
      `${ML_SERVICE_URL}/api/severity`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      severity: response.data.severity || 0,
      reasoning: response.data.reasoning || ''
    };
  } catch (error) {
    console.error('ML Severity Service Error:', error.message);
    return {
      success: false,
      severity: 5, // Default medium severity
      reasoning: 'ML service unavailable'
    };
  }
};

// Calculate priority score
export const calculatePriority = async (severity, latitude, longitude, populationDensity = 0.5) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/priority`,
      {
        severity,
        latitude,
        longitude,
        population_density: populationDensity
      },
      {
        timeout: 10000
      }
    );

    return {
      success: true,
      priority: response.data.priority || 0,
      breakdown: response.data.breakdown || {}
    };
  } catch (error) {
    console.error('ML Priority Service Error:', error.message);
    
    // Fallback calculation
    const priority = (
      0.6 * severity +
      0.3 * populationDensity +
      0.1 * 0.5 // location importance placeholder
    );
    
    return {
      success: false,
      priority: Math.round(priority * 10) / 10,
      breakdown: {
        severity_contribution: 0.6 * severity,
        population_contribution: 0.3 * populationDensity,
        location_contribution: 0.05
      }
    };
  }
};
