# ============================================================================
# SwachhCity — Train YOLOv8 GARBAGE DETECTION on TACO (Google Colab, GPU)
# ============================================================================
# WHY: The app's detector is base YOLOv8 trained on COCO, which only localizes
# discrete objects (bottles, cups). It sees nothing in mixed trash piles.
# Training on TACO (Trash Annotations in Context — real litter photos with
# bounding boxes) makes detection work on real-world garbage.
#
# HOW TO RUN (one time, ~30-60 min):
#   1. Open https://colab.research.google.com  ->  New notebook
#   2. Runtime -> Change runtime type -> T4 GPU
#   3. Get a FREE Roboflow API key: https://app.roboflow.com (Settings -> API)
#   4. Paste each numbered cell below into its own Colab cell and run in order
#   5. The last cell downloads `garbage_detect.pt` — put that file in
#      the project's `ml-service/` folder and restart the ML service. Done.
# ============================================================================

# %% ------------------------- CELL 1: install -------------------------------
# !pip install -q ultralytics roboflow

# %% ------------------------- CELL 2: download TACO dataset -----------------
from roboflow import Roboflow

ROBOFLOW_API_KEY = "PASTE_YOUR_FREE_API_KEY_HERE"

rf = Roboflow(api_key=ROBOFLOW_API_KEY)
# TACO: Trash Annotations in Context (YOLOv8 export)
project = rf.workspace("mohamed-traore-2ekkp").project("taco-trash-annotations-in-context")
dataset = project.version(16).download("yolov8")
print("Dataset downloaded to:", dataset.location)

# %% ------------------------- CELL 3: train on GPU --------------------------
from ultralytics import YOLO

model = YOLO("yolov8s.pt")  # small model: good accuracy/speed balance
results = model.train(
    data=f"{dataset.location}/data.yaml",
    epochs=60,
    imgsz=640,
    batch=16,
    device=0,          # Colab GPU
    name="swachh_garbage_detect",
    patience=15,
)

# %% ------------------------- CELL 4: evaluate (metrics for resume) ---------
metrics = model.val()
print("=========== RESULTS ===========")
print(f"mAP50:      {metrics.box.map50:.4f}  ({metrics.box.map50*100:.1f}%)")
print(f"mAP50-95:   {metrics.box.map:.4f}")
print(f"Precision:  {metrics.box.mp:.4f}")
print(f"Recall:     {metrics.box.mr:.4f}")
print("===============================")
# Note these numbers — mAP50 is the standard detection metric to quote.

# %% ------------------------- CELL 5: download the trained model ------------
import shutil
from google.colab import files

best = "runs/detect/swachh_garbage_detect/weights/best.pt"
shutil.copy(best, "garbage_detect.pt")
files.download("garbage_detect.pt")
# -> Save into the project's  ml-service/  folder, then restart the ML service.
#    yolo_detector.py auto-loads garbage_detect.pt when it exists.
