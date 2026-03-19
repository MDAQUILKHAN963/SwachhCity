# 🗑️ SwachhCity - Garbage Complaint Management System

A comprehensive civic sense web application for managing garbage complaints with ML-powered verification, real-time tracking, and intelligent worker assignment.

## 🚀 Features

- **ML-Powered Image Verification**: YOLOv8 detects garbage in uploaded images
- **Intelligent Priority Scoring**: Combines severity, location, and population density
- **Auto Worker Assignment**: Finds and assigns nearest available worker using geolocation
- **Real-time Updates**: Socket.io for live status updates
- **Worker Management**: Complete worker panel with navigation and status tracking
- **Admin Dashboard**: Analytics, heatmaps, and performance monitoring
- **Hotspot Prediction**: ML predicts areas likely to accumulate garbage

## 🛠️ Tech Stack

### Frontend
- **React.js** (JavaScript)
- **React Router** for routing
- **Tailwind CSS** for styling
- **Socket.io-client** for real-time updates
- **Leaflet.js** for maps
- **React Query** for server state
- **Zustand** for client state

### Backend
- **Node.js** + **Express.js** (JavaScript)
- **MongoDB** with Mongoose
- **Socket.io** for WebSocket
- **JWT** for authentication
- **Redis** for caching

### ML Service
- **Python** + **FastAPI**
- **YOLOv8** for object detection
- **EfficientNet** for severity classification
- **scikit-learn/XGBoost** for hotspot prediction

## 📁 Project Structure

```
swachhcity1/
├── frontend/          # React.js frontend
├── backend/           # Express.js backend
├── ml-service/        # FastAPI ML service
└── PROJECT_ROADMAP.md # Detailed roadmap
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Python 3.9+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd swachhcity1
```

2. **Set up Frontend**
```bash
cd frontend
npm install
npm run dev
```

3. **Set up Backend**
```bash
cd backend
npm install
npm run dev
```

4. **Set up ML Service**
```bash
cd ml-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

5. **Set up MongoDB**
- Install MongoDB locally or use MongoDB Atlas
- Update connection string in backend `.env`

## 📝 Environment Variables

Create `.env` files in each directory:

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swachhcity
JWT_SECRET=your-secret-key
ML_SERVICE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**ML Service (.env)**
```
PORT=8000
MODEL_PATH=./models/yolov8_garbage.pt
```

## 🎯 Development Roadmap

See [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) for detailed phase-by-phase breakdown.

## 📄 License

MIT License
