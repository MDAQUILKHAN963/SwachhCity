import Worker from '../models/Worker.js';
import Complaint from '../models/Complaint.js';
import Assignment from '../models/Assignment.js';

// @desc    Get assignments for the logged-in worker
// @route   GET /api/workers/my-assignments
// @access  Private (Worker)
export const getMyAssignments = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find worker profile associated with user
        const worker = await Worker.findOne({ userId });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker profile not found'
            });
        }

        // Find complaints assigned to this worker
        // You can also look up Assignment model, but Complaint has assignedWorkerId
        const assignments = await Complaint.find({
            assignedWorkerId: worker._id,
            status: { $ne: 'rejected' } // Show all others including resolved for history
        }).sort({ updatedAt: -1 });

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all available workers
// @route   GET /api/workers/available
// @access  Private (Admin)
export const getAvailableWorkers = async (req, res) => {
    try {
        const workers = await Worker.find({ status: 'available' })
            .populate('userId', 'name phone email');

        res.json({
            success: true,
            data: workers
        });
    } catch (error) {
        console.error('Get available workers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
