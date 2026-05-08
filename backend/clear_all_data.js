import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import Assignment from './src/models/Assignment.js';
import Worker from './src/models/Worker.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/swachhcity';

const clearAllData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Delete all Complaints
        const complaintResult = await Complaint.deleteMany({});
        console.log(`🗑️ Deleted ${complaintResult.deletedCount} complaints.`);

        // 2. Delete all Assignments
        const assignmentResult = await Assignment.deleteMany({});
        console.log(`🗑️ Deleted ${assignmentResult.deletedCount} assignments.`);

        // 3. Delete all Workers
        const workerResult = await Worker.deleteMany({});
        console.log(`🗑️ Deleted ${workerResult.deletedCount} workers.`);

        // 4. Delete all Users (citizens, admins, workers)
        const userResult = await User.deleteMany({});
        console.log(`🗑️ Deleted ${userResult.deletedCount} users.`);

        console.log('✅ All data cleared. System is completely fresh.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

clearAllData();
