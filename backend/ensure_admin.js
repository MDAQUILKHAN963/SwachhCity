
import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/swachhcity';

const ensureAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@city.com';
        let user = await User.findOne({ email });

        if (!user) {
            console.log(`Admin ${email} not found. Creating it...`);
            user = await User.create({
                name: 'City Admin',
                email: email,
                password: 'admin123',
                role: 'admin',
                phone: '1112223333',
                address: 'City Hall'
            });
            console.log('✅ Created Admin user');
        } else {
            console.log(`Found user: ${user.name} (${user.role})`);
            if (user.role !== 'admin') {
                user.role = 'admin';
                await user.save();
                console.log('✅ Updated role to admin');
            }

            // Reset password to be sure
            user.password = 'admin123';
            await user.save();
            console.log('✅ Password verified/reset to: admin123');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

ensureAdmin();
