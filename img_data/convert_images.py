#!/usr/bin/env python3
"""
Convert HEIC images to JPG format
Run this script to convert img_data folder images
"""

import os
from PIL import Image
import pillow_heif

# Register HEIF opener
pillow_heif.register_heif_opener()

# Paths
img_data_dir = os.path.dirname(os.path.abspath(__file__))

# HEIC files to convert
heic_files = [
    'IMG20260413081123.heic',
    'IMG20260413081144.heic', 
    'IMG20260413081206.heic'
]

# Mapping to simpler names
output_names = [
    'IMG1.jpg',
    'IMG2.jpg',
    'IMG3.jpg'
]

print("Converting HEIC images to JPG...")

for heic_file, jpg_name in zip(heic_files, output_names):
    heic_path = os.path.join(img_data_dir, heic_file)
    jpg_path = os.path.join(img_data_dir, jpg_name)
    
    if os.path.exists(heic_path):
        try:
            # Open HEIC and convert to JPG
            image = Image.open(heic_path)
            
            # Resize if too large (max 1024px)
            max_size = 1024
            image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Save as JPG
            image.convert('RGB').save(jpg_path, 'JPEG', quality=95)
            print(f"✓ {heic_file} → {jpg_name}")
        except Exception as e:
            print(f"✗ Error converting {heic_file}: {e}")
    else:
        print(f"✗ File not found: {heic_file}")

print("Done!")
