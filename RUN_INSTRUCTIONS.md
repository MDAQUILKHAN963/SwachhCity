# 🚀 How to Run SwachhCity with Real ML

Follow these steps to start the complete system. You will need **4 separate terminals**.

## 1. Prerequisites
- Node.js & npm installed
- Python 3.10+ installed
- MongoDB installed & running locally (or via Docker)

---

## 2. Start the Database (Terminal 1)
Ensure MongoDB is running.
- **Windows**: Open Task Manager > Services > Check if `MongoDB` is running.
- **Or Docker**: `docker run -d -p 27017:27017 --name mongo mongo:latest`

---

## 3. Start the ML Service (Terminal 2)
This handles image detection (YOLOv8) and predictions.
```powershell
cd ml-service
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
> ✅ **Success**: You should see "Application startup complete" at `http://localhost:8000`.

---

## 4. Start the Backend API (Terminal 3)
This handles users, complaints, and connects everything.
```powershell
cd backend
npm run dev
```
> ✅ **Success**: You should see "Server running on port 5000" and "MongoDB Connected".

---

## 5. Start the Frontend (Terminal 4)
This is the user interface.
```powershell
cd frontend
npm run dev
```
> ✅ **Success**: It will show a URL (e.g., `http://localhost:5173`). Open this in your browser.

---

## 🧪 Test Credentials
Use these accounts to test different roles:

| Role | Email | Password | Features to Test |
|------|-------|----------|------------------|
| **Citizen** | `citizen@test.com` | `password123` | Submit complaint, upload photo, view status |
| **Worker** | `worker@city.com` | `password123` | View assigned tasks, navigate, upload proof |
| **Admin** | `admin@city.com` | `admin123` | View heatmap, analytics, worker locations |

---

## 💡 Troubleshooting
- **White Screen?** Check if Backend (Terminal 3) is running.
- **ML Error?** Check if ML Service (Terminal 2) is running.
- **"Network Error"?** Ensure all 3 services (ML, Backend, Frontend) are running on ports 8000, 5000, and 5173 respectively.
