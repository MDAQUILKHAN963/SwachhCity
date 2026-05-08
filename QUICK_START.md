# 🚀 Quick Start Guide - SwachhCity

## Prerequisites
- Node.js v18+ installed
- MongoDB running (local or Atlas)
- Python 3.9+ installed

## Step 1: Environment Setup

### Backend (.env already created)
The `.env` file is already created in `backend/` directory with default values.

**If using MongoDB Atlas**, update `MONGODB_URI` in `backend/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/swachhcity
```

### Frontend (.env already created)
The `.env` file is already created in `frontend/` directory.

### ML Service (.env already created)
The `.env` file is already created in `ml-service/` directory.

## Step 2: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

### ML Service
```bash
cd ml-service
pip install -r requirements.txt
```

## Step 3: Start MongoDB

### Option A: Local MongoDB
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
# or
mongod
```

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `backend/.env`

## Step 4: Start All Services

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
✅ Backend running on http://localhost:5000

### Terminal 2 - ML Service
```bash
cd ml-service
python -m uvicorn app.main:app --reload
```
✅ ML Service running on http://localhost:8000

**Note**: If `uvicorn` command doesn't work, use `python -m uvicorn` instead.

### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend running on http://localhost:3000

## Step 5: Test the Application

1. **Open Browser**: Go to http://localhost:3000
2. **Register**: Click "Register here" → Fill form → Submit
3. **Login**: Use your credentials to login
4. **Submit Complaint**: 
   - Click "Submit Complaint"
   - Upload an image
   - Click "📍 Use Current Location"
   - Enter address
   - Click "Submit Complaint"
5. **View Dashboard**: See your complaint in the dashboard

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: MongoDB connection error
```
**Solution**: Make sure MongoDB is running or update `MONGODB_URI` in `backend/.env`

### Port Already in Use
```
Error: Port 5000 already in use
```
**Solution**: Change `PORT` in `backend/.env` or stop the process using port 5000

### Frontend Can't Connect to Backend
```
Network Error
```
**Solution**: 
- Check backend is running on port 5000
- Verify `VITE_API_URL` in `frontend/.env` is `http://localhost:5000`

### ML Service Not Responding
```
ML Service Error
```
**Solution**: 
- Check ML service is running on port 8000
- Verify `ML_SERVICE_URL` in `backend/.env` is `http://localhost:8000`
- Note: ML service will work with mock data even if not running (fallback)

## 📋 Default Credentials

After registration, you can login with:
- Email: (your registered email)
- Password: (your password)

## 🎯 What's Working

✅ User Registration  
✅ User Login  
✅ JWT Authentication  
✅ Complaint Submission  
✅ Image Upload  
✅ GPS Location  
✅ ML Detection (mock)  
✅ Real-time Updates  
✅ Dashboard  

## 📚 Next Steps

See [PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md) for detailed feature list and [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) for full roadmap.
