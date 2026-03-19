import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Worker from '../models/Worker.js';

dotenv.config();

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swachhcity');
        console.log('📦 MongoDB Connected');

        // Clear existing users
        await User.deleteMany({ email: { $in: ['citizen@test.com', 'worker@city.com', 'admin@city.com'] } });
        await Worker.deleteMany({ employeeId: 'W101' });

        console.log('🧹 Cleared existing test users');

        // 1. Create Citizen
        const citizen = await User.create({
            name: 'John Citizen',
            email: 'citizen@test.com',
            password: 'password123',
            role: 'citizen',
        });
        console.log('👤 Created Citizen: citizen@test.com');

        // 2. Create Admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@city.com',
            password: 'admin123',
            role: 'admin',
        });
        console.log('👑 Created Admin: admin@city.com');

        // 3. Create Worker User
        const workerUser = await User.create({
            name: 'Bob Worker',
            email: 'worker@city.com',
            password: 'password123',
            role: 'worker',
        });

        // 4. Create Worker Profile
        await Worker.create({
            userId: workerUser._id,
            employeeId: 'W101',
            location: {
                type: 'Point',
                coordinates: [77.5946, 12.9716] // Bangalore center
            },
            address: 'MG Road, Bangalore',
            status: 'available'
        });
        console.log('👷 Created Worker: worker@city.com');

        console.log('✅ Seeding Complete!');
        process.exit(0);
    } catch (err) {
        console.error('Errors:', err);
        process.exit(1);
    }
};

seedDB();
