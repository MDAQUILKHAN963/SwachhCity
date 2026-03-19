const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function checkStatus() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const Complaint = mongoose.model('Complaint', new mongoose.Schema({}, { strict: false }), 'complaints');
        const Assignment = mongoose.model('Assignment', new mongoose.Schema({}, { strict: false }), 'assignments');
        const Worker = mongoose.model('Worker', new mongoose.Schema({}, { strict: false }), 'workers');

        const complaintsCount = await Complaint.countDocuments();
        const assignmentsCount = await Assignment.countDocuments();
        const workersCount = await Worker.countDocuments();

        console.log('--- Statistics ---');
        console.log(`Complaints: ${complaintsCount}`);
        console.log(`Assignments: ${assignmentsCount}`);
        console.log(`Workers: ${workersCount}`);

        const workers = await Worker.find({});
        console.log('--- Workers ---');
        workers.forEach(w => {
            console.log(`Worker: ${w.employeeId || w._id}, Role: ${w.role}, Status: ${w.status}, Lat: ${w.location?.coordinates?.[1]}, Lng: ${w.location?.coordinates?.[0]}`);
        });

        const pendingComplaints = await Complaint.find({ status: 'pending' });
        console.log('--- Pending Complaints ---');
        pendingComplaints.forEach(c => {
            console.log(`Complaint: ${c._id}, Status: ${c.status}, Lat: ${c.location?.coordinates?.[1]}, Lng: ${c.location?.coordinates?.[0]}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStatus();
