from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

# Initialize models
enable_mock = os.getenv("ENABLE_MOCK_ML", "false").lower() == "true"
detector = None
severity_model = None
brand_detector = None
predictor = None
location_intel = None

if not enable_mock:
    try:
        from app.models.yolo_detector import YoloDetector
        detector = YoloDetector()
        
        from app.models.severity_classifier import SeverityClassifier
        severity_model = SeverityClassifier()
        
        from app.models.brand_detector import BrandDetector
        brand_detector = BrandDetector()
    except Exception as e:
        print(f"Failed to initialize detection models: {e}")
else:
    print("⚠️  Using Mock Detection (ENABLE_MOCK_ML=true)")

try:
    from app.models.predictor import GarbagePredictor
    predictor = GarbagePredictor()
except Exception as e:
    print(f"Failed to import GarbagePredictor: {e}")

try:
    from app.models.location_intelligence import LocationIntelligence
    location_intel = LocationIntelligence()
except Exception as e:
    print(f"Failed to import LocationIntelligence: {e}")

try:
    from app.models.routing_engine import RoutingEngine
    routing_engine = RoutingEngine()
except Exception as e:
    print(f"Failed to import RoutingEngine: {e}")
    routing_engine = None

try:
    from app.models.verification_service import VerificationService
    verification_service = VerificationService()
except Exception as e:
    print(f"Failed to import VerificationService: {e}")
    verification_service = None

app = FastAPI(
    title="SwachhCity ML Service",
    description="ML-powered garbage detection, severity analysis, and brand identification",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "SwachhCity ML Service v2.1.0 is active!",
        "features": ["YOLOv8 Detection", "EfficientNet Severity", "OCR Brand Detection", "RF Hotspot Prediction"]
    }

from fastapi import Form

@app.post("/api/detect")
async def detect_garbage(file: UploadFile = File(...), description: str = Form(None)):
    """
    Detect garbage, brands, calculate severity, and verify text description in one go.
    """
    try:
        contents = await file.read()
        
        results = {
            "detected": False,
            "confidence": 0.0,
            "severity": 1,
            "garbageType": "unknown",
            "brands": [],
            "performance_upgrade": True,
            "verification": {"verified": True, "reason": "No verification requested."}
        }

        # 1. Object Detection (YOLO) & Segregation
        yolo_classes = []
        segregation_report = {}
        if detector:
            yolo_res = detector.detect(contents)
            results.update({
                "detected": yolo_res["detected"],
                "confidence": yolo_res["confidence"],
                "garbageType": yolo_res["garbageType"],
                "object_count": yolo_res.get("object_count", 0),
                "bounding_boxes": yolo_res.get("all_detections", []),
                "segregation": yolo_res.get("segregation_report", {})
            })
            yolo_classes = [d['class'] for d in yolo_res.get("all_detections", [])]
            segregation_report = yolo_res.get("segregation_report", {})

        # 2. Advanced Severity (EfficientNet)
        if severity_model:
            sev_res = severity_model.predict(contents)
            results["severity"] = sev_res["severity"]
            results["severity_reasoning"] = sev_res["reasoning"]

        # 3. Brand Detection (OCR)
        if brand_detector:
            brand_res = brand_detector.detect_brands(contents)
            results["brands"] = brand_res["brands"]
            results["corporate_accountability"] = brand_res["corporates_accountable"]

        # 4. Semantic Verification
        if verification_service and description:
            verification_res = verification_service.verify_consistency(
                description=description, 
                detected_classes=yolo_classes, 
                segregation_report=segregation_report
            )
            results["verification"] = verification_res

        if not detector and not severity_model:
            # Fallback mock
            results.update({"detected": True, "confidence": 0.85, "severity": 5, "mock": True})

        return results
    except Exception as e:
        return {"detected": False, "error": str(e)}

@app.post("/api/severity")
async def calculate_severity(file: UploadFile = File(...)):
    """
    Dedicated endpoint for EfficientNet severity classification.
    """
    try:
        contents = await file.read()
        if severity_model:
            return severity_model.predict(contents)
        return {"severity": 5, "reasoning": "Model not loaded"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/priority")
async def calculate_priority(
    severity: float,
    latitude: float,
    longitude: float,
    population_density: float = 0.5
):
    # (Existing logic kept for compatibility)
    loc_importance = 0.1
    nearest_poi = None
    if location_intel:
        loc_importance, nearest_poi = location_intel.calculate_location_importance(latitude, longitude)
    
    priority_score = (0.5 * (severity / 10.0)) + (0.3 * loc_importance) + (0.2 * population_density)
    
    return {
        "priority": round(priority_score, 2),
        "breakdown": {
            "severity_score": severity,
            "location_importance": loc_importance,
            "nearest_poi": nearest_poi
        }
    }

@app.get("/api/predict-hotspots")
async def predict_hotspots():
    if not predictor:
        return JSONResponse(status_code=503, content={"error": "Prediction model not loaded"})
    try:
        return {"success": True, "data": predictor.predict_next_week()}
    except Exception as e:
        return {"success": False, "error": str(e)}

from pydantic import BaseModel
from typing import List, Optional

class HotspotObj(BaseModel):
    id: str
    lat: float
    lng: float
    severity: Optional[float] = 5.0

class RouteRequest(BaseModel):
    hotspots: List[HotspotObj]
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None

@app.post("/api/optimize-route")
async def optimize_route(req: RouteRequest):
    """
    Calculate an optimized TSP route for garbage collection.
    """
    if not routing_engine:
        return JSONResponse(status_code=503, content={"error": "Routing Engine not loaded"})
    try:
        hotspots_dict = [h.dict() for h in req.hotspots]
        result = routing_engine.optimize_route(hotspots_dict, req.start_lat, req.start_lng)
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
