import Complaint from '../models/Complaint.js';
import Worker from '../models/Worker.js';
import mongoose from 'mongoose';
import axios from 'axios';

// @desc    Get stats for a specific user
// @route   GET /api/analytics/user-stats
// @access  Private (Citizen)
export const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await Complaint.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalReports: { $sum: 1 },
                    totalPoints: { $sum: '$severity' },
                    resolvedCount: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || { totalReports: 0, totalPoints: 0, resolvedCount: 0 };

        res.json({
            success: true,
            data: {
                totalReports: result.totalReports,
                totalPoints: Math.round(result.totalPoints),
                resolvedCount: result.resolvedCount,
                totalKg: Math.round(result.totalPoints * 1.5), // Formula: Points * 1.5kg
                totalCo2: (result.totalPoints * 0.45).toFixed(1), // Formula: Points * 0.45kg CO2
                rank: 'City Guardian'
            }
        });
    } catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get dashboard summary statistics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
export const getDashboardStats = async (req, res) => {
    try {
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: { $in: ['pending', 'verified', 'assigned', 'in-progress'] } });
        const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });

        // Calculate resolution rate
        const resolutionRate = totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0;

        const totalWorkers = await Worker.countDocuments();
        const activeWorkers = await Worker.countDocuments({ status: 'busy' });

        res.json({
            success: true,
            data: {
                complaints: {
                    total: totalComplaints,
                    pending: pendingComplaints,
                    resolved: resolvedComplaints,
                    resolutionRate
                },
                workers: {
                    total: totalWorkers,
                    active: activeWorkers,
                    available: totalWorkers - activeWorkers
                }
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all complaints for map visualization
// @route   GET /api/analytics/map-data
// @access  Private (Admin)
export const getMapData = async (req, res) => {
    try {
        // Fetch relevant fields only for map performance
        const complaints = await Complaint.find({})
            .select('location status severity priority address imageUrl')
            .lean();

        res.json({
            success: true,
            data: complaints
        });
    } catch (error) {
        console.error('Map data error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get potential hotspots based on clustering
// @route   GET /api/analytics/hotspots
// @access  Private (Admin)
export const getHotspots = async (req, res) => {
    try {
        // In a real ML scenario, we'd run a clustering algo (DBSCAN/K-Means)
        // For now, we return high-severity unresolved complaints as "hotspots"
        const hotspots = await Complaint.find({
            status: { $ne: 'resolved' },
            severity: { $gte: 7 }
        }).select('location address severity');

        const formattedHotspots = hotspots.map(h => ({
            lat: h.location.coordinates[1],
            lng: h.location.coordinates[0],
            radius: 300 + (h.severity * 50), // Dynamic radius based on severity
            intensity: h.severity,
            name: h.address
        }));

        res.json({
            success: true,
            data: formattedHotspots
        });
    } catch (error) {
        console.error('Hotspots error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get leaderboard data (Top Citizens & Workers)
// @route   GET /api/analytics/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
    try {
        // 1. Top Citizens (Based on Impact Points = Sum of Severity)
        const topCitizens = await Complaint.aggregate([
            { $group: { _id: '$userId', points: { $sum: '$severity' }, count: { $sum: 1 } } },
            { $sort: { points: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    name: '$user.name',
                    points: { $round: ['$points', 1] },
                    count: 1,
                    role: '$user.role'
                }
            }
        ]);

        // 2. Top Workers (Based on Impact Points = Sum of Severity resolved)
        const topWorkers = await Complaint.aggregate([
            { $match: { status: 'resolved', assignedWorkerId: { $ne: null } } },
            { $group: { _id: '$assignedWorkerId', points: { $sum: '$severity' }, count: { $sum: 1 } } },
            { $sort: { points: -1 } },
            { $limit: 5 },
            // Lookup Worker to get UserId
            {
                $lookup: {
                    from: 'workers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'worker'
                }
            },
            { $unwind: '$worker' },
            // Lookup User to get Name
            {
                $lookup: {
                    from: 'users',
                    localField: 'worker.userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1, // This is Worker ID
                    name: '$user.name',
                    points: { $round: ['$points', 1] },
                    count: 1,
                    role: 'worker'
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                citizens: topCitizens,
                workers: topWorkers
            }
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get predicted hotspots from ML Service
// @route   GET /api/analytics/predictions
// @access  Private
export const getPredictedHotspots = async (req, res) => {
    try {
        // Call Python ML Service
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
        const response = await axios.get(`${mlServiceUrl}/api/predict-hotspots`);

        if (response.data.success) {
            res.json({
                success: true,
                data: response.data.data
            });
        } else {
            throw new Error('ML Service prediction failed');
        }
    } catch (error) {
        console.error('Prediction error:', error.message);
        // Fallback or empty if ML service is down
        res.json({
            success: true,
            data: [],
            message: 'ML Service unavailable, using fallback/empty data'
        });
    }
};
