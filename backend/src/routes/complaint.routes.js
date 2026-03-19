import express from 'express';
import {
  submitComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  analyzeComplaint,
  getPublicComplaints
} from '../controllers/complaint.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/public', getPublicComplaints);

// All other routes require authentication
router.use(protect);

// Routes
router.post('/submit', upload.single('image'), submitComplaint);
router.post('/analyze', upload.single('image'), analyzeComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.put('/:id/status', upload.single('image'), updateComplaintStatus);
router.post('/:id/assign', authorize('admin'), assignComplaint);

export default router;
