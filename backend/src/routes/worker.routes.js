import express from 'express';
import { getMyAssignments, getAvailableWorkers } from '../controllers/worker.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/my-assignments', authorize('worker'), getMyAssignments);
router.get('/available', authorize('admin'), getAvailableWorkers);

export default router;
