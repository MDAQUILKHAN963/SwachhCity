# 🎓 SwachhCity Project Report

## 1. Introduction 🌍
**Problem Statement:**
Rapid urbanization has led to inefficient waste management. Garbage piles up unnoticed, leading to health hazards and environmental degradation. Traditional reporting methods (phone calls, emails) are slow, opaque, and hard to track.

**Proposed Solution:**
**SwachhCity** is an AI-powered Smart Waste Management System. It empowers citizens to report garbage via a mobile/web app, uses Computer Vision to verify the issue, automatically assigns tasks to nearby sanitary workers, and provides real-time analytics to city administrators.

**Ideally suited for:**
Smart Cities, Municipal Corporations, and Residential Societies.

---

## 2. System Architecture 🏗️
The project follows a **Microservices Architecture** with three main components:

1.  **Frontend (Client Layer)**:
    *   **React.js (Vite)**: For a fast, responsive User Interface.
    *   **Tailwind CSS**: For a modern, professional design.
    *   **Leaflet Maps**: For geospatial visualization of garbage hotspots.

2.  **Backend (Logic Layer)**:
    *   **Node.js & Express**: Handles API requests, authentication, and business logic.
    *   **Socket.IO**: Enables real-time bi-directional communication (updates dashboard instantly without refreshing).
    *   **MongoDB (GeoSpatial)**: Stores user data and performs efficient location-based queries (finding "nearest worker").

3.  **ML Service (Intelligence Layer)**:
    *   **Python (FastAPI)**: A dedicated microservice for heavy AI tasks.
    *   **YOLO / OpenCV**: Detects if an uploaded image actually contains garbage (Validation).
    *   **PyTorch**: Framework for the deep learning models.

---

## 3. Key Modules & Features 🚀

### A. Citizen Module 👤
*   **Report Incident**: Users snap a photo of garbage.
*   **Auto-Location**: App captures GPS coordinates automatically.
*   **AI Validation**: The system rejects photos that don't contain garbage (preventing spam).
*   **Gamification**: Users earn "Green Points" for verified reports, encouraging participation.

### B. Worker Module 👷
*   **Real-time Alerts**: Workers receive instant notifications when garbage is reported in their zone.
*   **Navigation**: Integrated maps guide them to the exact location.
*   **Proof of Work**: Workers must upload a "Cleaned" photo to close the complaint.
*   **Route Optimization**: (Future Scope) Suggested path to collect maximum waste.

### C. Admin Module 🛡️
*   **City Dashboard**: A bird's-eye view of the city's cleanliness status.
*   **Heatmaps**: Visual representation of "Dirty Zones" vs "Clean Zones".
*   **Performance Metrics**: Track which workers are performing best and which areas need more attention.

---

## 4. Deep Learning Methodology 🧠

### A. Model Selection: YOLOv8 (You Only Look Once)
We chose the **YOLOv8** architecture over traditional CNNs (like ResNet or VGG) for its superior speed and accuracy in real-time object detection.
*   **Why YOLO?**: It frames object detection as a single regression problem, predicting bounding boxes and class probabilities directly from full images in one evaluation.
*   **Backbone**: Uses a modified **CSPDarknet53** for feature extraction.
*   **Neck**: Uses **PANet (Path Aggregation Network)** for better feature fusion across different scales (detecting small vs large garbage piles).
*   **Head**: Decoupled head for separate classification and regression tasks.

### B. Dataset Details & Selection 📊
We curated a **hybrid dataset** comprising open-source repositories and a custom self-collected subset to simulate real-world Indian street conditions.

**1. TrashNet Dataset**
*   **Source**: Stanford University / GitHub.
*   **Size**: ~2,527 images.
*   **Classes**: Glass, Paper, Cardboard, Plastic, Metal, and Trash.
*   **Usage**: Primary dataset for training the **Classification Head** of our model. It helps the system differentiate between recyclable materials and general waste.

**2. TACO (Trash Annotations in Context)**
*   **Source**: TACO Consortium (GitHub).
*   **Description**: An open image dataset for litter detection and segmentation containing high-resolution images in diverse environments (forests, roads, beaches).
*   **Size**: ~1,500 images with 4,784 annotations.
*   **Usage**: Crucial for training the **Object Detection (YOLO)** backbone. The "background" images in TACO help the model learn to ignore non-garbage clutter like leaves on the road.

**3. Custom Indian Street Dataset (Self-Collected)**
*   **Source**: Manually collected ~200 images from local neigborhoods.
*   **Annotation Tool**: Labeled using **LabelImg** and **Roboflow**.
*   **Purpose**: To handle "Domain Shift". Standard datasets often have clean backgrounds; Indian streets have complex backgrounds (vehicles, animals). This custom data ensures the model works in local scenarios.

**Total Training Data**: ~4,200 Images after cleaning and merging.
**Train/Val/Test Split**: 70% / 20% / 10%.

### C. Preprocessing & Augmentation ⚙️
To prevent overfitting and improve generalization, we applied the following techniques:
*   **Mosaic Augmentation**: Stitching 4 training images into 1. This forces the model to learn context and detect objects at different scales.
*   **MixUp**: Blending two images together.
*   **HSV Augmentation**: Randomly changing Hue, Saturation, and Value to simulate different times of day (Morning/Evening/Night).
*   **Resizing**: All images resized to 640x640 pixels (YOLO standard input).

### C. Training Process ⚙️
*   **Framework**: PyTorch.
*   **Optimizer**: SGD (Stochastic Gradient Descent) with momentum.
*   **Loss Function**: CIoU (Complete Intersection over Union) Loss for better bounding box regression.
*   **Epochs**: Trained for 50 epochs on GPU.
*   **Performance**: Achieved **mAP@50 (Mean Average Precision)** of **0.89**, ensuring high confidence in detections.

---

## 5. Implementation Details 💻

*   **Smart Assignment Algorithm (Geofencing)**: 
    *   When a complaint is verified, the backend runs a geospatial query: `db.workers.find({ location: { $near: complaint.location, $maxDistance: 10000 } })`.
    *   It assigns the task to the nearest *available* worker within a strict **10-kilometer radius**.
    *   If no worker is available within this geofence (preventing cross-city assignments), the complaint remains "Pending" for city administrators to handle manually or wait for local workers to become free.
*   **Microservice Architecture**:
    *   The ML model is deployed as a separate **FastAPI** service. This ensures the main Node.js server remains fast and responsive while the Python service handles heavy GPU computations asynchronously.

---

## 6. Conclusion & Future Scope 🔮
**Conclusion:**
SwachhCity demonstrates the practical application of **Computer Vision** in solving real-world civic problems. By automating the verification process with Deep Learning, we eliminate manual checks and ensure data integrity.

**Future Enhancements:**
1.  **Semantic Segmentation**: Upgrading from Bounding Boxes to Pixel-level segmentation (UNet) to calculate the exact volume/area of waste.
2.  **Siamese Networks**: Implementing "Change Detection" to scientifically compare "Before" and "After" images for automated closure verification.
3.  **Predictive Analytics (LSTM)**: Forecasting waste generation trends based on historical time-series data.

