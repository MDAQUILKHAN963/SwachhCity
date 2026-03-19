from ultralytics import YOLO
import sys

def verify():
    print("Testing YOLOv8 loading...")
    try:
        model = YOLO("yolov8n.pt")
        print("✅ Model loaded successfully!")
        
        # Test inference on a dummy image (zeros)
        import numpy as np
        img = np.zeros((640, 640, 3), dtype=np.uint8)
        results = model(img)
        print("✅ Inference test passed!")
        
    except Exception as e:
        print(f"❌ Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify()
