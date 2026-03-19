from ultralytics import YOLO
import os
import sys

def train_model():
    """
    Train a Custom YOLOv8 Model for Garbage Detection
    """
    print("🚀 Starting SwachhCity Model Training...")
    
    # Check for dataset
    dataset_yaml = "dataset/data.yaml"
    if not os.path.exists(dataset_yaml):
        print(f"❌ Dataset configuration not found at {dataset_yaml}")
        print("Please create a 'dataset' folder with 'data.yaml' and your images first.")
        print("Example structure:")
        print("  dataset/")
        print("    ├── data.yaml")
        print("    ├── train/ (images & labels)")
        print("    └── val/ (images & labels)")
        return

    # Load a model
    # yolov8n.pt is the nano model - fastest and smallest
    print("📦 Loading base model (yolov8n.pt)...")
    model = YOLO("yolov8n.pt") 

    # Train the model
    print("🔥 Beginning training...")
    try:
        results = model.train(
            data=dataset_yaml,
            epochs=50,             # Number of epochs
            imgsz=640,             # Image size
            batch=16,              # Batch size
            name="swachhcity_v1",  # Output name
            patience=10,           # Early stopping
            device="cpu"           # Use "0" for GPU if available, "cpu" for compatibility
        )
        
        print("✅ Training Complete!")
        print(f"Model saved to: runs/detect/swachhcity_v1/weights/best.pt")
        print("You can now update your main.py to use this model path.")
        
    except Exception as e:
        print(f"❌ Error during training: {e}")

if __name__ == "__main__":
    train_model()
