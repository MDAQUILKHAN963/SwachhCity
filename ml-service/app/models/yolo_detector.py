import cv2
import numpy as np
from ultralytics import YOLO
import os

class YoloDetector:
    def __init__(self, model_path="yolov8n.pt"):
        """
        Initialize YOLOv8 model. Loads a custom garbage-trained detector if present
        ('garbage_detect.pt' from the TACO Colab training, or legacy 'trashnet.pt');
        otherwise falls back to base COCO 'yolov8n.pt'.
        """
        custom_candidates = ["garbage_detect.pt", "trashnet.pt"]
        custom_model = next((m for m in custom_candidates if os.path.exists(m)), None)
        if custom_model:
            print(f"Loading custom garbage detection model from {custom_model}...")
            self.model = YOLO(custom_model)
            self.using_custom = True
            # Use the class names baked into the trained model
            self.class_names = self.model.names
        else:
            print(f"Loading base YOLOv8 model from {model_path}...")
            self.model = YOLO(model_path)
            self.using_custom = False
            # COCO indices for garbage-related objects
            self.garbage_classes = [39, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 64, 67, 73, 77]

    def detect(self, image_bytes):
        """
        Run inference on an image.
        Returns dictionary with detection results.
        """
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            results = self.model(img)
            
            detections = []
            max_confidence = 0.0
            detected = False
            unique_labels = set()
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    if self.using_custom:
                        # In TrashNet, everything is garbage
                        label = self.class_names[cls] if cls < len(self.class_names) else "unknown"
                        is_garbage = True
                    else:
                        label = self.model.names[cls]
                        is_garbage = cls in self.garbage_classes
                    
                    if is_garbage:
                         max_confidence = max(max_confidence, conf)
                         detected = True
                         unique_labels.add(label)
                    
                    detections.append({
                        "class": label,
                        "confidence": round(conf, 2),
                        "garbage_suspected": is_garbage,
                        "bbox": box.xywh.tolist()[0]
                    })

            garbage_count = sum(1 for d in detections if d['garbage_suspected'])
            
            # Segregation Logic
            segregation_report = {
                "organic": 0,
                "recyclable": 0,
                "hazardous": 0,
                "other": 0
            }
            
            recyclable_classes = ['bottle', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'book', 'glass', 'metal', 'paper', 'plastic', 'cardboard']
            organic_classes = ['banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake']
            hazardous_classes = ['mouse', 'cell phone'] # E-waste
            
            for d in detections:
                if d['garbage_suspected']:
                    lbl = d['class']
                    if lbl in recyclable_classes:
                        segregation_report["recyclable"] += 1
                    elif lbl in organic_classes:
                        segregation_report["organic"] += 1
                    elif lbl in hazardous_classes:
                        segregation_report["hazardous"] += 1
                    else:
                        segregation_report["other"] += 1

            # Severity mapping (kept as counts for YOLO part, 
            # but main.py will now use EfficientNet for final severity)
            if garbage_count == 0:
                severity = 0
                label = "No identifiable garbage"
            elif garbage_count <= 3:
                severity = 3
                label = "Low - Scattered items"
            elif garbage_count <= 6:
                severity = 6
                label = "Medium - Pile"
            else:
                severity = 9
                label = "High - Large Dump"

            # Determine garbageType based on valid Mongoose enum values:
            # ['plastic', 'organic', 'electronic', 'metal', 'other', 'unknown']
            category_counts = {
                "plastic": 0,
                "organic": 0,
                "electronic": 0,
                "metal": 0,
                "other": 0
            }
            
            plastic_classes = ['bottle', 'cup', 'bowl', 'plastic']
            organic_classes = ['banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake']
            electronic_classes = ['mouse', 'cell phone', 'laptop', 'tv', 'keyboard']
            metal_classes = ['fork', 'knife', 'spoon', 'can', 'metal']
            
            for d in detections:
                if d['garbage_suspected']:
                    lbl = d['class'].lower()
                    if lbl in plastic_classes or 'plastic' in lbl:
                        category_counts["plastic"] += 1
                    elif lbl in organic_classes:
                        category_counts["organic"] += 1
                    elif lbl in electronic_classes or 'electronic' in lbl:
                        category_counts["electronic"] += 1
                    elif lbl in metal_classes or 'metal' in lbl:
                        category_counts["metal"] += 1
                    else:
                        category_counts["other"] += 1

            garbage_type = "unknown"
            if garbage_count > 0:
                best_category = max(category_counts.items(), key=lambda x: x[1])
                if best_category[1] > 0:
                    garbage_type = best_category[0]
                else:
                    garbage_type = "other"

            return {
                "detected": detected,
                "confidence": round(max_confidence, 2),
                "severity_count_based": severity,
                "garbageType": garbage_type,
                "object_count": garbage_count,
                "all_detections": detections,
                "segregation_report": segregation_report,
                "is_custom_model": self.using_custom
            }
            
        except Exception as e:
            print(f"Error in YOLO detection: {e}")
            return {"detected": False, "error": str(e)}
