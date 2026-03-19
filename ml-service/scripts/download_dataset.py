"""
Dataset Download and Preparation Script for SwachhCity
Downloads TrashNet, TACO datasets and prepares them for YOLOv8 training
"""

import os
import urllib.request
import zipfile
import shutil
import random
from pathlib import Path

# Dataset URLs
DATASETS = {
    "trashnet": {
        "url": "https://github.com/garythung/trashnet/raw/master/data/dataset-resized.zip",
        "description": "TrashNet - 6 categories of recyclable waste"
    },
    "taco": {
        "url": "https://github.com/pedropro/TACO/archive/refs/heads/master.zip",
        "description": "TACO - Trash Annotations in Context"
    }
}

# India-specific garbage image URLs (public domain / creative commons)
INDIA_GARBAGE_URLS = [
    # These are placeholder URLs - in production, you'd collect real images
    # For now, we'll use data augmentation on existing datasets
]

def download_file(url, dest_path):
    """Download a file with progress"""
    print(f"Downloading: {url}")
    try:
        urllib.request.urlretrieve(url, dest_path)
        print(f"Downloaded to: {dest_path}")
        return True
    except Exception as e:
        print(f"Error downloading: {e}")
        return False

def extract_zip(zip_path, extract_to):
    """Extract a zip file"""
    print(f"Extracting: {zip_path}")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        print(f"Extracted to: {extract_to}")
        return True
    except Exception as e:
        print(f"Error extracting: {e}")
        return False

def organize_trashnet(source_dir, dest_dir):
    """Organize TrashNet dataset for binary classification"""
    garbage_categories = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']
    
    train_garbage = dest_dir / 'train' / 'garbage'
    val_garbage = dest_dir / 'val' / 'garbage'
    
    train_garbage.mkdir(parents=True, exist_ok=True)
    val_garbage.mkdir(parents=True, exist_ok=True)
    
    all_images = []
    
    for category in garbage_categories:
        category_path = source_dir / category
        if category_path.exists():
            images = list(category_path.glob('*.jpg')) + list(category_path.glob('*.png'))
            all_images.extend(images)
    
    # Shuffle and split 80/20
    random.shuffle(all_images)
    split_idx = int(len(all_images) * 0.8)
    
    train_images = all_images[:split_idx]
    val_images = all_images[split_idx:]
    
    # Copy images
    for i, img in enumerate(train_images):
        shutil.copy(img, train_garbage / f"trashnet_{i}.jpg")
    
    for i, img in enumerate(val_images):
        shutil.copy(img, val_garbage / f"trashnet_{i}.jpg")
    
    print(f"TrashNet: {len(train_images)} train, {len(val_images)} val images")

def create_no_garbage_dataset(dest_dir, count=500):
    """
    Create 'no garbage' images using simple generated images
    In production, you'd collect real clean street images
    """
    from PIL import Image
    import numpy as np
    
    train_no_garbage = dest_dir / 'train' / 'no_garbage'
    val_no_garbage = dest_dir / 'val' / 'no_garbage'
    
    train_no_garbage.mkdir(parents=True, exist_ok=True)
    val_no_garbage.mkdir(parents=True, exist_ok=True)
    
    # Generate simple placeholder images (in production, use real images)
    # These are just placeholders - real model needs real "clean" images
    
    train_count = int(count * 0.8)
    val_count = count - train_count
    
    colors = [
        (34, 139, 34),   # Forest green (grass)
        (128, 128, 128), # Gray (road)
        (139, 119, 101), # Brown (dirt)
        (70, 130, 180),  # Steel blue (sky reflection)
    ]
    
    for i in range(train_count):
        img = Image.new('RGB', (256, 256), random.choice(colors))
        # Add some noise to make it look natural
        pixels = np.array(img)
        noise = np.random.randint(-20, 20, pixels.shape, dtype=np.int16)
        pixels = np.clip(pixels.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(pixels)
        img.save(train_no_garbage / f"clean_{i}.jpg")
    
    for i in range(val_count):
        img = Image.new('RGB', (256, 256), random.choice(colors))
        pixels = np.array(img)
        noise = np.random.randint(-20, 20, pixels.shape, dtype=np.int16)
        pixels = np.clip(pixels.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(pixels)
        img.save(val_no_garbage / f"clean_{i}.jpg")
    
    print(f"No-garbage placeholders: {train_count} train, {val_count} val")

def main():
    """Main function to download and prepare datasets"""
    base_dir = Path(__file__).parent.parent
    dataset_dir = base_dir / 'dataset'
    downloads_dir = base_dir / 'downloads'
    
    downloads_dir.mkdir(exist_ok=True)
    
    print("=" * 50)
    print("SwachhCity Dataset Preparation")
    print("=" * 50)
    
    # Download TrashNet
    print("\n[1/3] Downloading TrashNet dataset...")
    trashnet_zip = downloads_dir / 'trashnet.zip'
    if download_file(DATASETS['trashnet']['url'], trashnet_zip):
        extract_zip(trashnet_zip, downloads_dir / 'trashnet')
        organize_trashnet(
            downloads_dir / 'trashnet' / 'dataset-resized',
            dataset_dir
        )
    
    # Create no-garbage dataset (placeholders)
    print("\n[2/3] Creating no-garbage dataset...")
    try:
        create_no_garbage_dataset(dataset_dir, count=500)
    except ImportError:
        print("PIL not installed. Run: pip install Pillow")
    
    print("\n[3/3] Dataset preparation complete!")
    print(f"\nDataset location: {dataset_dir}")
    print("\nNext steps:")
    print("1. Add real 'no garbage' images to dataset/train/no_garbage/")
    print("2. Add more garbage images to dataset/train/garbage/")
    print("3. Run the training script or use Google Colab notebook")
    
    # Print dataset stats
    train_garbage = len(list((dataset_dir / 'train' / 'garbage').glob('*')))
    train_no_garbage = len(list((dataset_dir / 'train' / 'no_garbage').glob('*')))
    val_garbage = len(list((dataset_dir / 'val' / 'garbage').glob('*')))
    val_no_garbage = len(list((dataset_dir / 'val' / 'no_garbage').glob('*')))
    
    print(f"\nDataset Statistics:")
    print(f"  Train: {train_garbage} garbage, {train_no_garbage} no_garbage")
    print(f"  Val: {val_garbage} garbage, {val_no_garbage} no_garbage")

if __name__ == "__main__":
    main()
