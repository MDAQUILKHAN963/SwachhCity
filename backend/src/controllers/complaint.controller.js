import Complaint from '../models/Complaint.js';
import Worker from '../models/Worker.js';
import Assignment from '../models/Assignment.js';
import { detectGarbage, calculateSeverity, calculatePriority } from '../services/ml.service.js';
import { estimatePopulationDensity } from '../utils/geolocation.js';
import User from '../models/User.js';
import { sendComplaintCreated, sendWorkerAssigned, sendStatusUpdated } from '../services/sms.service.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Submit a complaint
// @route   POST /api/complaints/submit
// @access  Private
export const submitComplaint = async (req, res) => {
  try {
    const { latitude, longitude, address, description, isAnonymous } = req.body;
    const userId = req.user.id;

    // Validation
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    if (!latitude || !longitude || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide location (latitude, longitude) and address'
      });
    }

    const imagePath = req.file.path;
    let imageUrl = `/uploads/${req.file.filename}`;

    // Call ML service for garbage detection
    const mlResult = await detectGarbage(imagePath);

    if (!mlResult.detected && mlResult.success) {
      // ML detected no garbage - reject complaint
      return res.status(400).json({
        success: false,
        message: 'No garbage detected in the image. Please upload a clear image showing garbage.',
        mlConfidence: mlResult.confidence
      });
    }

    // Calculate severity
    const severityResult = await calculateSeverity(imagePath);
    const severity = severityResult.severity || mlResult.severity || 5;

    // Estimate population density
    const populationDensity = estimatePopulationDensity(latitude, longitude);

    // Calculate priority
    const priorityResult = await calculatePriority(
      severity,
      latitude,
      longitude,
      populationDensity
    );
    const priority = priorityResult.priority || 5;

    // Calculate estimated cleanup time (simple logic based on severity)
    const estimatedCleanupTime = Math.max(1, Math.round(severity * 1.5));

    // Create complaint
    const complaint = await Complaint.create({
      userId,
      imageUrl,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address,
      description,
      status: mlResult.detected ? 'verified' : 'pending',
      severity,
      priority: priority || 'medium',
      garbageType: mlResult.garbageType || 'unknown',
      estimatedCleanupTime: estimatedCleanupTime || 24,
      mlVerified: mlResult.success && mlResult.detected,
      mlConfidence: mlResult.confidence || 0.5,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      statusHistory: [{
        status: mlResult.detected ? 'verified' : 'pending',
        changedAt: new Date(),
        notes: mlResult.detected ? 'AI Verified' : 'Awaiting verification'
      }]
    });

    // Upload to Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result = await cloudinary.uploader.upload(imagePath, {
          folder: 'swachhcity/complaints',
        });
        complaint.imageUrl = result.secure_url;
        await complaint.save();

        // Cleanup local file
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary Upload Error:', cloudinaryError);
        // Keep local URL as fallback if Cloudinary fails
      }
    }

    // Add status history
    complaint.statusHistory.push({
      status: complaint.status,
      changedAt: new Date(),
      changedBy: userId,
      notes: mlResult.detected ? 'ML verified garbage detected' : 'Pending ML verification'
    });
    await complaint.save();

    // Send SMS to citizen (if phone configured)
    try {
      const user = await User.findById(userId).select('phone name');
      if (user) {
        await sendComplaintCreated(user, complaint);
      }
    } catch (e) {
      console.error('SMS (complaint created) error:', e.message);
    }

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('new_complaint', {
        id: complaint._id,
        location: complaint.location,
        severity: complaint.severity,
        priority: complaint.priority,
        status: complaint.status
      });
    }

    // Auto-assign worker if verified
    if (complaint.status === 'verified') {
      await autoAssignWorker(complaint._id, io);
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaint: {
          id: complaint._id,
          imageUrl: complaint.imageUrl,
          location: complaint.location,
          address: complaint.address,
          status: complaint.status,
          severity: complaint.severity,
          priority: complaint.priority,
          mlVerified: complaint.mlVerified,
          mlConfidence: complaint.mlConfidence
        }
      }
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Auto-assign nearest worker
const autoAssignWorker = async (complaintId, io) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return;

    const [longitude, latitude] = complaint.location.coordinates;

    // Find nearest available worker using MongoDB geospatial query
    const nearestWorker = await Worker.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 10000 // 10km radius
        }
      },
      status: 'available'
    }).limit(1);

    if (nearestWorker) {
      // Create assignment
      const assignment = await Assignment.create({
        complaintId: complaint._id,
        workerId: nearestWorker._id,
        status: 'assigned'
      });

      // Update complaint
      complaint.assignedWorkerId = nearestWorker._id;
      complaint.status = 'assigned';
      complaint.assignedAt = new Date();
      complaint.statusHistory.push({
        status: 'assigned',
        changedAt: new Date(),
        changedBy: nearestWorker._id,
        notes: `Auto-assigned to worker ${nearestWorker.employeeId}`
      });
      await complaint.save();

      // Update worker
      nearestWorker.currentAssignmentId = complaint._id;
      nearestWorker.status = 'busy';
      await nearestWorker.save();

      // Emit real-time event to worker (room keyed by worker's userId)
      if (io) {
        io.to(`worker_${nearestWorker.userId}`).emit('new_assignment', {
          assignmentId: assignment._id,
          complaint: {
            id: complaint._id,
            imageUrl: complaint.imageUrl,
            location: complaint.location,
            address: complaint.address,
            severity: complaint.severity,
            priority: complaint.priority
          }
        });
      }

      // Send SMS to worker (if phone configured)
      try {
        const workerUser = await User.findById(nearestWorker.userId).select('phone name');
        if (workerUser) {
          await sendWorkerAssigned(workerUser, complaint);
        }
      } catch (e) {
        console.error('SMS (worker assigned) error:', e.message);
      }
    }
  } catch (error) {
    console.error('Auto-assign worker error:', error);
  }
};

// @desc    Analyze a potential complaint (severity + waste type)
// @route   POST /api/complaints/analyze
// @access  Private
export const analyzeComplaint = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image for analysis'
      });
    }

    const imagePath = req.file.path;

    // Call ML services
    const [mlResult, severityResult] = await Promise.all([
      detectGarbage(imagePath),
      calculateSeverity(imagePath)
    ]);

    const severity = severityResult.severity || mlResult.severity || 5;

    // Cleanup local file immediately since we don't save to DB
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.status(200).json({
      success: true,
      data: {
        detected: mlResult.detected,
        confidence: mlResult.confidence,
        severity: severity,
        garbageType: mlResult.garbageType || 'unknown',
        reasoning: severityResult.reasoning || 'AI analysis complete',
        estimatedCleanupTime: Math.max(2, Math.round(severity * 0.8)) // Simple estimate: 2 to 8 hours
      }
    });
  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Self-analysis failed',
      error: error.message
    });
  }
};

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
export const getComplaints = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build query
    let query = {};

    // Citizens can only see their own complaints
    if (userRole === 'citizen') {
      query.userId = userId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email')
      .populate('assignedWorkerId', 'employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        complaints,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const complaint = await Complaint.findById(id)
      .populate('userId', 'name email phone')
      .populate('assignedWorkerId', 'employeeId address')
      .populate('statusHistory.changedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check access: citizens can only see their own complaints
    if (userRole === 'citizen' && complaint.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this complaint'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        complaint
      }
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get public complaints for landing page map
// @route   GET /api/complaints/public
// @access  Public
export const getPublicComplaints = async (req, res) => {
  try {
    // Only return minimal data for public view
    const complaints = await Complaint.find({
      status: { $in: ['pending', 'verified', 'assigned', 'in-progress', 'resolved'] }
    })
      .select('location status address imageUrl createdAt severity')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        complaints
      }
    });
  } catch (error) {
    console.error('Get public complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Update status
    complaint.status = status;
    complaint.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: userId,
      notes: notes || ''
    });

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
      // Handle proof image if uploaded
      if (req.file) {
        const localPath = req.file.path;
        complaint.afterCleanupImage = `/uploads/${req.file.filename}`;

        // Upload to Cloudinary if configured
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          try {
            const result = await cloudinary.uploader.upload(localPath, {
              folder: 'swachhcity/resolutions',
            });
            complaint.afterCleanupImage = result.secure_url;

            // Cleanup local file
            if (fs.existsSync(localPath)) {
              fs.unlinkSync(localPath);
            }
          } catch (cloudinaryError) {
            console.error('Cloudinary Resolution Upload Error:', cloudinaryError);
          }
        }
      }
    }

    await complaint.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_status_updated', {
        complaintId: complaint._id,
        status: complaint.status,
        updatedAt: complaint.updatedAt
      });
    }

    // Send SMS update to citizen when status changes
    try {
      const user = await User.findById(complaint.userId).select('phone name');
      if (user) {
        await sendStatusUpdated(user, complaint);
      }
    } catch (e) {
      console.error('SMS (status updated) error:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Complaint status updated',
      data: {
        complaint
      }
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// @desc    Manually assign a worker to a complaint
// @route   POST /api/complaints/:id/assign
// @access  Private (Admin)
export const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;
    const adminId = req.user.id;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    if (worker.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Worker is currently busy' });
    }

    // Create assignment
    const assignment = await Assignment.create({
      complaintId: complaint._id,
      workerId: worker._id,
      status: 'assigned'
    });

    // Update complaint
    complaint.assignedWorkerId = worker._id;
    complaint.status = 'assigned';
    complaint.assignedAt = new Date();
    complaint.statusHistory.push({
      status: 'assigned',
      changedAt: new Date(),
      changedBy: adminId,
      notes: `Manually assigned by admin to worker ${worker.employeeId}`
    });
    await complaint.save();

    // Update worker
    worker.currentAssignmentId = complaint._id;
    worker.status = 'busy';
    await worker.save();

    // Emit real-time events
    const io = req.app.get('io');
    if (io) {
      // Notify the worker
      io.to(`worker_${worker.userId}`).emit('new_assignment', {
        assignmentId: assignment._id,
        complaint: {
          id: complaint._id,
          imageUrl: complaint.imageUrl,
          location: complaint.location,
          address: complaint.address,
          severity: complaint.severity,
          priority: complaint.priority
        }
      });

      // Notify everyone about status update
      io.emit('complaint_status_updated', {
        complaintId: complaint._id,
        status: complaint.status,
        updatedAt: complaint.updatedAt
      });
    }

    // Send SMS to worker (if phone configured)
    try {
      const workerUser = await User.findById(worker.userId).select('phone name');
      if (workerUser) {
        await sendWorkerAssigned(workerUser, complaint);
      }
    } catch (e) {
      console.error('SMS (worker assigned) error:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Complaint assigned successfully',
      data: { complaint, assignment }
    });
  } catch (error) {
    console.error('Manual assign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
