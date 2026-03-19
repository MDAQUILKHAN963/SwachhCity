import express from 'express';
import {
    getDashboardStats,
    getMapData,
    getHotspots,
    getLeaderboard,
    getPredictedHotspots,
    getUserStats
} from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Citizen & Admin routes
router.get('/user-stats', getUserStats);
router.get('/leaderboard', getLeaderboard);

// Admin-only routes
router.get('/dashboard', authorize('admin'), getDashboardStats);
router.get('/map-data', authorize('admin'), getMapData);
router.get('/hotspots', authorize('admin'), getHotspots);
router.get('/predictions', authorize('admin'), getPredictedHotspots);

export default router;
