from ultralytics import YOLO
from pathlib import Path
import numpy as np
import cv2


class WasteClassifier:
    """
    Waste TYPE classifier trained on TrashNet (6 classes). Unlike the COCO
    detector, this always returns a waste category for any image, so the waste
    type is never 'unknown' just because no COCO object was detected.
    """

    # TrashNet class -> Complaint.garbageType enum value
    ENUM_MAP = {
        "plastic": "plastic",
        "metal": "metal",
        "glass": "glass",
        "paper": "paper",
        "cardboard": "cardboard",
        "trash": "trash",
    }

    def __init__(self, model_path=None):
        if model_path is None:
            # ml-service/trashnet_cls.pt  (app/models/ -> parents[2] == ml-service)
            model_path = Path(__file__).resolve().parents[2] / "trashnet_cls.pt"
        model_path = Path(model_path)
        if not model_path.exists():
            raise FileNotFoundError(
                f"Trained waste classifier not found at {model_path}. "
                f"Run scripts/train_trashnet_cls.py first."
            )
        print(f"Loading TrashNet waste classifier from {model_path} ...")
        self.model = YOLO(str(model_path))

    def classify(self, image_bytes):
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        results = self.model(img, verbose=False)
        r = results[0]
        top1 = int(r.probs.top1)
        conf = float(r.probs.top1conf)
        raw = self.model.names[top1]
        return {
            "wasteType": self.ENUM_MAP.get(raw, "other"),
            "rawClass": raw,
            "confidence": round(conf, 3),
        }
