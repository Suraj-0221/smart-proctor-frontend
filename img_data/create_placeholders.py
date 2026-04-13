#!/usr/bin/env python3
"""
Create placeholder student images (500x500 px) with names
These can be replaced with actual student photos
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create img_data directory if it doesn't exist
img_data_dir = os.path.dirname(os.path.abspath(__file__))

students = [
    {
        'filename': 'IMG1.jpg',
        'name': 'Aarav Sharma',
        'color': (52, 152, 219)  # Blue
    },
    {
        'filename': 'IMG2.jpg',
        'name': 'Priya Patel',
        'color': (155, 89, 182)  # Purple
    },
    {
        'filename': 'IMG3.jpg',
        'name': 'Raj Kumar',
        'color': (46, 204, 113)  # Green
    }
]

print("Creating placeholder student images...")

for student in students:
    # Create image
    img = Image.new('RGB', (500, 500), color=student['color'])
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fall back to default
    try:
        font = ImageFont.truetype("arial.ttf", 40)
        name_font = ImageFont.truetype("arial.ttf", 32)
    except:
        font = ImageFont.load_default()
        name_font = ImageFont.load_default()
    
    # Add text
    text = "📷"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_position = ((500 - text_width) // 2, (200 - text_height) // 2)
    draw.text(text_position, text, fill='white', font=font)
    
    # Add student name
    name = student['name']
    bbox = draw.textbbox((0, 0), name, font=name_font)
    name_width = bbox[2] - bbox[0]
    name_position = ((500 - name_width) // 2, 280)
    draw.text(name_position, name, fill='white', font=name_font)
    
    # Save
    filepath = os.path.join(img_data_dir, student['filename'])
    img.save(filepath, 'JPEG', quality=95)
    print(f"✓ Created {student['filename']}")

print("Done! Note: These are placeholder images. Replace with actual student photos.")
