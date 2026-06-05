import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['assigned', 'accepted', 'in-progress', 'completed', 'rejected'],
    default: 'assigned'
  },
  notes: {
    type: String,
    trim: true
  },
  afterCleanupImage: {
    type: String
  },
  resolutionTime: {
    type: Number // in minutes
  },
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

// Indexes
assignmentSchema.index({ complaintId: 1 });
assignmentSchema.index({ workerId: 1 });
assignmentSchema.index({ status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
