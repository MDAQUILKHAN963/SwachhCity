"""
Download TrashNet and organize it into a YOLOv8 *classification* dataset:

    trashnet_cls/
      train/<class>/*.jpg
      val/<class>/*.jpg

6 classes: cardboard, glass, metal, paper, plastic, trash
80/20 stratified train/val split.
"""
import os
import urllib.request
import zipfile
import shutil
import random
from pathlib import Path

random.seed(42)

BASE = Path(__file__).resolve().parent.parent          # ml-service/
DL_DIR = BASE / "downloads"
OUT = BASE / "trashnet_cls"
URL = "https://github.com/garythung/trashnet/raw/master/data/dataset-resized.zip"
CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]


def main():
    DL_DIR.mkdir(exist_ok=True)
    zip_path = DL_DIR / "trashnet.zip"

    if not zip_path.exists() or zip_path.stat().st_size < 1_000_000:
        print(f"Downloading TrashNet from {URL} ...")
        urllib.request.urlretrieve(URL, zip_path)
    print(f"Zip size: {zip_path.stat().st_size/1e6:.1f} MB")

    extract_dir = DL_DIR / "trashnet_extracted"
    if not extract_dir.exists():
        print("Extracting ...")
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(extract_dir)

    # Find the dataset-resized folder
    src = extract_dir / "dataset-resized"
    if not src.exists():
        # fallback: search
        for p in extract_dir.rglob("dataset-resized"):
            src = p
            break
    print(f"Source dataset: {src}")

    if OUT.exists():
        shutil.rmtree(OUT)

    counts = {}
    for cls in CLASSES:
        cls_dir = src / cls
        imgs = sorted(list(cls_dir.glob("*.jpg")) + list(cls_dir.glob("*.png")))
        random.shuffle(imgs)
        split = int(len(imgs) * 0.8)
        train_imgs, val_imgs = imgs[:split], imgs[split:]

        for subset, subset_imgs in (("train", train_imgs), ("val", val_imgs)):
            dest = OUT / subset / cls
            dest.mkdir(parents=True, exist_ok=True)
            for i, img in enumerate(subset_imgs):
                shutil.copy(img, dest / f"{cls}_{i}.jpg")
        counts[cls] = (len(train_imgs), len(val_imgs))

    print("\nDataset prepared at:", OUT)
    total_t = total_v = 0
    for cls, (t, v) in counts.items():
        print(f"  {cls:10s}: {t:4d} train / {v:4d} val")
        total_t += t
        total_v += v
    print(f"  {'TOTAL':10s}: {total_t:4d} train / {total_v:4d} val")


if __name__ == "__main__":
    main()
