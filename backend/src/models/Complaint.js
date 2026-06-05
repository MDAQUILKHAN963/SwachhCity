import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'assigned', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  severity: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  priority: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  garbageType: {
    type: String,
    enum: ['plastic', 'organic', 'electronic', 'metal', 'other', 'unknown'],
    default: 'unknown'
  },
  estimatedCleanupTime: {
    type: Number, // in hours
    default: 24
  },
  mlVerified: {
    type: Boolean,
    default: false
  },
  mlConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  // Number of garbage objects detected by YOLO
  objectCount: {
    type: Number,
    default: 0
  },
  // Waste segregation breakdown { organic, recyclable, hazardous, other }
  segregation: {
    type: Map,
    of: Number,
    default: {}
  },
  // Brands identified via OCR (corporate accountability)
  brands: [{
    name: String,
    matchedText: String,
    confidence: Number
  }],
  corporateAccountability: {
    type: Boolean,
    default: false
  },
  // Semantic verification of the citizen's description vs detected image content
  verification: {
    verified: { type: Boolean, default: true },
    confidence: { type: Number, default: 1 },
    reason: { type: String, default: '' }
  },
  assignedWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    default: null
  },
  assignedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  afterCleanupImage: {
    type: String
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
complaintSchema.index({ location: '2dsphere' });

// Index for faster queries
complaintSchema.index({ userId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ assignedWorkerId: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
