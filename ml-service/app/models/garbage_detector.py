"""
Garbage Detection Model
Uses YOLOv8 for garbage detection and classification
"""

import os
from pathlib import Path
from PIL import Image
import io
import random

# Check if ultralytics is installed
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("Warning: ultralytics not installed. Using mock detection.")

class GarbageDetector:
    """
    Garbage detection model using YOLOv8
    Falls back to mock detection if model not available
    """
    
    def __init__(self, model_path=None):
        self.model = None
        self.model_loaded = False
        
        if model_path is None:
            model_path = os.environ.get('YOLO_MODEL_PATH', './models/garbage_classifier.pt')
        
        self.model_path = Path(model_path)
        
        # Try to load model
        self._load_model()
    
    def _load_model(self):
        """Load the YOLOv8 model"""
        if not YOLO_AVAILABLE:
            print("YOLOv8 not available. Using mock detection.")
            return
        
        if not self.model_path.exists():
            print(f"Model not found at {self.model_path}. Using mock detection.")
            print("Train the model using the provided notebook and place it in the models folder.")
            return
        
        try:
            self.model = YOLO(str(self.model_path))
            self.model_loaded = True
            print(f"Model loaded successfully from {self.model_path}")
        except Exception as e:
            print(f"Error loading model: {e}")
            print("Using mock detection.")
    
    def detect(self, image_bytes):
        """
        Detect garbage in image
        
        Args:
            image_bytes: Image file bytes
            
        Returns:
            dict: Detection results
        """
        if self.model_loaded and self.model:
            return self._real_detection(image_bytes)
        else:
            return self._mock_detection(image_bytes)
    
    def _real_detection(self, image_bytes):
        """Real detection using YOLOv8"""
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            
            # Run inference
            results = self.model(image, verbose=False)
            
            # Parse results
            for r in results:
                probs = r.probs
                
                if probs is None:
                    # Object detection model
                    boxes = r.boxes
                    if len(boxes) > 0:
                        return {
                            "detected": True,
                            "confidence": float(boxes[0].conf[0]) if len(boxes) > 0 else 0.0,
                            "severity": self._estimate_severity(len(boxes)),
                            "garbageType": "mixed",
                            "bounding_boxes": [
                                {
                                    "x": float(box.xyxy[0][0]),
                                    "y": float(box.xyxy[0][1]),
                                    "width": float(box.xyxy[0][2] - box.xyxy[0][0]),
                                    "height": float(box.xyxy[0][3] - box.xyxy[0][1]),
                                    "confidence": float(box.conf[0])
                                }
                                for box in boxes
                            ]
                        }
                else:
                    # Classification model
                    top1_idx = probs.top1
                    top1_conf = float(probs.top1conf)
                    class_name = r.names[top1_idx]
                    
                    # Check if garbage detected
                    is_garbage = class_name.lower() == 'garbage' or top1_idx == 0
                    
                    return {
                        "detected": is_garbage,
                        "confidence": top1_conf if is_garbage else 1 - top1_conf,
                        "severity": self._estimate_severity_from_image(image) if is_garbage else 0,
                        "garbageType": self._classify_garbage_type(class_name),
                        "class": class_name,
                        "bounding_boxes": []
                    }
            
            return self._mock_detection(image_bytes)
            
        except Exception as e:
            print(f"Detection error: {e}")
            return self._mock_detection(image_bytes)
    
    def _mock_detection(self, image_bytes):
        """Mock detection for testing without model"""
        # Simulate realistic detection
        # In production, this would be replaced by actual model inference
        
        # For demo purposes, assume garbage is detected in most images
        detected = random.random() > 0.1  # 90% chance of detection
        confidence = random.uniform(0.75, 0.98) if detected else random.uniform(0.1, 0.3)
        severity = random.randint(4, 9) if detected else 0
        
        garbage_types = ['plastic', 'organic', 'metal', 'mixed', 'paper', 'other']
        garbage_type = random.choice(garbage_types) if detected else 'none'
        
        return {
            "detected": detected,
            "confidence": round(confidence, 2),
            "severity": severity,
            "garbageType": garbage_type,
            "bounding_boxes": [],
            "mock": True,  # Flag to indicate mock data
            "message": "Using mock detection. Train and load real model for production use."
        }
    
    def _estimate_severity(self, num_detections):
        """Estimate severity based on number of detected garbage items"""
        if num_detections >= 10:
            return 9
        elif num_detections >= 7:
            return 8
        elif num_detections >= 5:
            return 7
        elif num_detections >= 3:
            return 6
        elif num_detections >= 2:
            return 5
        else:
            return 4
    
    def _estimate_severity_from_image(self, image):
        """Estimate severity from image characteristics"""
        # Simple heuristic based on image properties
        # In production, use a dedicated severity classifier
        
        width, height = image.size
        # Assume larger areas of garbage = higher severity
        
        return random.randint(4, 8)  # Placeholder
    
    def _classify_garbage_type(self, class_name):
        """Map model class names to garbage types"""
        mapping = {
            'garbage': 'mixed',
            'trash': 'mixed',
            'plastic': 'plastic',
            'paper': 'paper',
            'cardboard': 'paper',
            'glass': 'glass',
            'metal': 'metal',
            'organic': 'organic',
        }
        return mapping.get(class_name.lower(), 'other')


# Singleton instance
_detector = None

def get_detector():
    """Get or create detector instance"""
    global _detector
    if _detector is None:
        _detector = GarbageDetector()
    return _detector
