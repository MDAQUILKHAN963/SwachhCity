"""
Train a YOLOv8 classification model on TrashNet (6 waste classes) and report
validation top-1 / top-5 accuracy. Saves the best weights to
ml-service/trashnet_cls.pt for the detection service to load.
"""
from ultralytics import YOLO
from pathlib import Path
import shutil
import json

BASE = Path(__file__).resolve().parent.parent      # ml-service/
DATA = BASE / "trashnet_cls"
EPOCHS = 30
IMGSZ = 224
MODEL = "yolov8s-cls.pt"


def main():
    print(f"Loading base classifier {MODEL} ...")
    model = YOLO(MODEL)

    print(f"Training on {DATA} for {EPOCHS} epochs (CPU) ...")
    model.train(
        data=str(DATA),
        epochs=EPOCHS,
        imgsz=IMGSZ,
        batch=32,
        device="cpu",
        name="trashnet_cls",
        patience=10,
        verbose=True,
    )

    # Evaluate on val split
    print("Evaluating on validation set ...")
    metrics = model.val()
    top1 = float(metrics.top1)
    top5 = float(metrics.top5)

    # Locate best.pt and copy to a stable path
    best = Path(model.trainer.best)
    target = BASE / "trashnet_cls.pt"
    shutil.copy(best, target)

    result = {
        "top1_accuracy": round(top1, 4),
        "top5_accuracy": round(top5, 4),
        "top1_pct": round(top1 * 100, 2),
        "top5_pct": round(top5 * 100, 2),
        "epochs": EPOCHS,
        "model": MODEL,
        "classes": list(model.names.values()),
        "best_weights": str(target),
    }
    (BASE / "trashnet_metrics.json").write_text(json.dumps(result, indent=2))

    print("\n================ RESULTS ================")
    print(f"Top-1 accuracy: {top1*100:.2f}%")
    print(f"Top-5 accuracy: {top5*100:.2f}%")
    print(f"Best weights:   {target}")
    print("=========================================")


if __name__ == "__main__":
    main()
