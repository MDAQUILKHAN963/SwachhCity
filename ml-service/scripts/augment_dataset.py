"""
Data Augmentation Script for SwachhCity
Increases dataset size using various augmentation techniques
"""

import os
import random
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

def augment_image(image):
    """Apply random augmentations to an image"""
    augmentations = []
    
    # Random rotation
    if random.random() > 0.5:
        angle = random.randint(-30, 30)
        image = image.rotate(angle, fillcolor=(128, 128, 128))
        augmentations.append(f"rotate_{angle}")
    
    # Random flip
    if random.random() > 0.5:
        image = image.transpose(Image.FLIP_LEFT_RIGHT)
        augmentations.append("flip_h")
    
    if random.random() > 0.5:
        image = image.transpose(Image.FLIP_TOP_BOTTOM)
        augmentations.append("flip_v")
    
    # Brightness adjustment
    if random.random() > 0.5:
        factor = random.uniform(0.7, 1.3)
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(factor)
        augmentations.append(f"bright_{factor:.1f}")
    
    # Contrast adjustment
    if random.random() > 0.5:
        factor = random.uniform(0.8, 1.2)
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(factor)
        augmentations.append(f"contrast_{factor:.1f}")
    
    # Color saturation
    if random.random() > 0.5:
        factor = random.uniform(0.8, 1.2)
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(factor)
        augmentations.append(f"color_{factor:.1f}")
    
    # Gaussian blur (simulates camera blur)
    if random.random() > 0.7:
        image = image.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.5)))
        augmentations.append("blur")
    
    # Add noise (simulates low-quality camera)
    if random.random() > 0.7:
        img_array = np.array(image)
        noise = np.random.randint(-15, 15, img_array.shape, dtype=np.int16)
        img_array = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        image = Image.fromarray(img_array)
        augmentations.append("noise")
    
    return image, augmentations

def augment_dataset(source_dir, target_dir, augment_factor=3):
    """
    Augment all images in source_dir and save to target_dir
    augment_factor: number of augmented versions per original image
    """
    source_path = Path(source_dir)
    target_path = Path(target_dir)
    target_path.mkdir(parents=True, exist_ok=True)
    
    image_extensions = ['.jpg', '.jpeg', '.png', '.webp']
    images = [f for f in source_path.iterdir() if f.suffix.lower() in image_extensions]
    
    print(f"Found {len(images)} images in {source_dir}")
    
    total_created = 0
    
    for img_path in images:
        try:
            # Copy original
            original = Image.open(img_path).convert('RGB')
            original = original.resize((640, 640))  # Resize for YOLO
            original.save(target_path / f"orig_{img_path.stem}.jpg")
            total_created += 1
            
            # Create augmented versions
            for i in range(augment_factor):
                augmented, augs = augment_image(original.copy())
                aug_name = f"aug{i}_{img_path.stem}.jpg"
                augmented.save(target_path / aug_name)
                total_created += 1
                
        except Exception as e:
            print(f"Error processing {img_path}: {e}")
    
    print(f"Created {total_created} images in {target_dir}")
    return total_created

def main():
    """Main augmentation pipeline"""
    base_dir = Path(__file__).parent.parent
    dataset_dir = base_dir / 'dataset'
    augmented_dir = base_dir / 'dataset_augmented'
    
    print("=" * 50)
    print("SwachhCity Data Augmentation")
    print("=" * 50)
    
    # Augment training data
    print("\n[1/4] Augmenting training garbage images...")
    augment_dataset(
        dataset_dir / 'train' / 'garbage',
        augmented_dir / 'train' / 'garbage',
        augment_factor=3
    )
    
    print("\n[2/4] Augmenting training no-garbage images...")
    augment_dataset(
        dataset_dir / 'train' / 'no_garbage',
        augmented_dir / 'train' / 'no_garbage',
        augment_factor=2
    )
    
    print("\n[3/4] Processing validation garbage images...")
    augment_dataset(
        dataset_dir / 'val' / 'garbage',
        augmented_dir / 'val' / 'garbage',
        augment_factor=1  # Less augmentation for validation
    )
    
    print("\n[4/4] Processing validation no-garbage images...")
    augment_dataset(
        dataset_dir / 'val' / 'no_garbage',
        augmented_dir / 'val' / 'no_garbage',
        augment_factor=1
    )
    
    print("\n" + "=" * 50)
    print("Augmentation complete!")
    print(f"Augmented dataset: {augmented_dir}")

if __name__ == "__main__":
    main()
