
import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import Assignment from './src/models/Assignment.js';
import Worker from './src/models/Worker.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/swachhcity';

const clearData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Delete all Complaints
        const complaintResult = await Complaint.deleteMany({});
        console.log(`🗑️ Deleted ${complaintResult.deletedCount} complaints.`);

        // 2. Delete all Assignments
        const assignmentResult = await Assignment.deleteMany({});
        console.log(`🗑️ Deleted ${assignmentResult.deletedCount} assignments.`);

        // 3. Reset Workers
        const workerResult = await Worker.updateMany(
            {},
            {
                $set: {
                    status: 'available',
                    currentAssignmentId: null,
                    totalComplaintsResolved: 0 // Optional: Reset stats too if "fresh start" implies it
                }
            }
        );
        console.log(`🔄 Reset status for ${workerResult.matchedCount} workers.`);

        console.log('✅ All reports cleared. System is ready for fresh testing.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

clearData();
