
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Worker from './src/models/Worker.js';
import Complaint from './src/models/Complaint.js';
import Assignment from './src/models/Assignment.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/swachhcity';

const fixWorker = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'worker@city.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User ${email} not found. Creating it...`);
            // Create if doesn't exist
            await User.create({
                name: 'City Worker',
                email: email,
                password: 'password123', // Will be hashed by pre-save hook
                role: 'worker',
                phone: '9876543210',
                address: 'City Center'
            });
            console.log('✅ Created worker user');
        } else {
            console.log(`Found user: ${user.name} (${user.role})`);
            if (user.role !== 'worker') {
                user.role = 'worker';
                await user.save();
                console.log('✅ Updated role to worker');
            } else {
                console.log('User is already a worker');
            }

            // Reset password to be sure
            user.password = 'password123';
            await user.save();
            console.log('✅ Password reset to: password123');

            // --- Worker Profile & Assignment ---
            let workerProfile = await Worker.findOne({ userId: user._id });
            if (!workerProfile) {
                workerProfile = await Worker.create({
                    userId: user._id,
                    employeeId: 'WORKER-001',
                    location: { type: 'Point', coordinates: [77.2090, 28.6139] }, // Delhi coordinates
                    address: 'City Center',
                    status: 'available'
                });
                console.log('✅ Created Worker Profile');
            } else {
                console.log('✅ Worker Profile exists');
            }

            // Find any pending complaint and assign it
            const complaint = await Complaint.findOne({ status: 'verified' });
            if (complaint) {
                console.log(`Found pending complaint: ${complaint._id}`);

                // Create Assignment
                await Assignment.create({
                    complaintId: complaint._id,
                    workerId: workerProfile._id,
                    assignedAt: new Date(),
                    status: 'assigned',
                    notes: 'Manual assignment via fix script'
                });

                // Update Complaint status
                complaint.status = 'assigned';
                complaint.assignedWorkerId = workerProfile._id;
                await complaint.save();

                // Update Worker status
                workerProfile.currentAssignmentId = complaint._id;
                workerProfile.status = 'busy';
                await workerProfile.save();

                console.log('✅ Manually assigned complaint to worker');
            } else {
                console.log('No pending/verified complaints found to assign.');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixWorker();
