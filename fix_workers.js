const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function fixWorkers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
        const Worker = mongoose.model('Worker', new mongoose.Schema({}, { strict: false }), 'workers');

        const workersWithoutRecords = await User.find({ role: 'worker' });
        console.log(`Found ${workersWithoutRecords.length} worker users.`);

        for (const user of workersWithoutRecords) {
            const existingWorker = await Worker.findOne({ userId: user._id });
            if (!existingWorker) {
                console.log(`Creating worker record for ${user.email}...`);

                // Use a default location for existing workers (Delhi)
                await Worker.create({
                    userId: user._id,
                    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
                    location: {
                        type: 'Point',
                        coordinates: [77.2090, 28.6139]
                    },
                    address: user.address || 'Default Delhi Address',
                    status: 'available'
                });
                console.log(`Fixed worker: ${user.email}`);
            } else {
                console.log(`Worker record already exists for ${user.email}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixWorkers();
