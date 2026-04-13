import io
import os
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import easyocr

app = FastAPI()

# Initialize EasyOCR reader (English language) - works for both printed and handwritten
print("Loading EasyOCR models...")
ocr_reader = easyocr.Reader(['en'], gpu=False)
print("EasyOCR loaded successfully!")

# Allow CORS so the React app can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def scan_hand_for_text(image: np.ndarray, hand_label: str = "") -> bool:
    """
    Scan hand image directly for ANY text using EasyOCR.
    Simple, direct approach - just look for text.
    """
    if image.size == 0:
        return False
    
    try:
        # Enhance image quality for better OCR
        # Convert to LAB and apply CLAHE
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)
        
        # Run OCR on enhanced image
        results = ocr_reader.readtext(enhanced_rgb)
        
        detected_text = []
        
        if not results:
            print(f"[{hand_label}] ✓ No text detected")
            return False
        
        # Extract all detected text with confidence check
        for detection in results:
            text = detection[1]
            confidence = detection[2]
            
            # Accept if confidence > 0.20 (20%) - catches even faint text
            if confidence > 0.20 and len(text.strip()) > 0:
                detected_text.append(f"{text}({confidence:.0%})")
        
        if detected_text:
            text_found = ", ".join(detected_text)
            print(f"[{hand_label}] ⚠️ TEXT DETECTED: {text_found}")
            return True
        
        print(f"[{hand_label}] ✓ Clean - no text")
        return False
        
    except Exception as e:
        print(f"[{hand_label}] OCR Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def scan_calculator_for_keywords(image: np.ndarray, label: str = "CALCULATOR") -> dict:
    """
    Scan calculator image for Casio/FX/CW keywords or model numbers.
    Simple, direct approach using EasyOCR.
    """
    if image.size == 0:
        return {"detected": False, "text": ""}
    
    try:
        # Enhance image quality for better OCR
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)
        
        # Run OCR directly
        results = ocr_reader.readtext(enhanced_rgb)
        
        if not results:
            print(f"[{label}] No text detected")
            return {"detected": False, "text": ""}
        
        # Extract all detected text
        detected_text = []
        for detection in results:
            text = detection[1]
            confidence = detection[2]
            if confidence > 0.20 and len(text.strip()) > 0:
                detected_text.append(text.strip())
        
        full_text = " ".join(detected_text)
        print(f"[{label}] OCR Results: {full_text}")
        
        return {"detected": True, "text": full_text}
        
    except Exception as e:
        print(f"[{label}] OCR Error: {e}")
        import traceback
        traceback.print_exc()
        return {"detected": False, "text": ""}


@app.post("/api/verify/hands")
async def verify_hands(image: UploadFile = File(...)):
    """
    Verify hands are clean by scanning for any text.
    """
    try:
        contents = await image.read()
        
        # Convert image bytes to numpy array
        pil_image = Image.open(io.BytesIO(contents)).convert('RGB')
        cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        rgb_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
        
        print(f"\n=== HAND VERIFICATION STARTED ===")
        print(f"Image shape: {rgb_image.shape}")
        
        # Scan the entire image for text
        has_text = scan_hand_for_text(rgb_image, "HANDS")
        
        if has_text:
            print(f"RESULT: FLAGGED - Suspicious marks/text detected\n")
            return {
                "status": "flagged",
                "reason": "Suspicious marks/text detected on hands"
            }
        
        print(f"RESULT: APPROVED - Both palms clean\n")
        return {
            "status": "approved",
            "reason": "Both palms clean. No suspicious text or marks detected."
        }
        
    except Exception as e:
        print(f"Hand verification error: {e}")
        import traceback
        traceback.print_exc()
        print(f"RESULT: ERROR\n")
        return {
            "status": "flagged",
            "reason": "Verification error: Unable to process image"
        }


@app.post("/api/verify/calculator")
async def verify_calculator(image: UploadFile = File(...)):
    """
    Verify calculator is authorized Casio model.
    Uses EasyOCR to scan for CASIO, FX, CW keywords or model numbers.
    """
    try:
        contents = await image.read()
        
        # Convert image to numpy array
        pil_image = Image.open(io.BytesIO(contents)).convert('RGB')
        cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        rgb_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
        
        print(f"\n=== CALCULATOR VERIFICATION STARTED ===")
        print(f"Image shape: {rgb_image.shape}")
        
        # Scan for Casio keywords
        result = scan_calculator_for_keywords(rgb_image, "CALCULATOR")
        
        if not result["detected"] or not result["text"]:
            print(f"RESULT: NO TEXT DETECTED\n")
            return {
                "status": "flagged",
                "reason": "No text detected. Please show calculator model clearly."
            }
        
        upper_text = result["text"].upper()
        
        # Valid Casio models
        valid_models = [
            "991CW", "570CW", "350CW", "82CW",
            "991EX", "570EX", "350EX",
            "991ES", "570ES", "115ES", "82ES",
            "991MS", "570MS", "100MS", "95MS", "85MS", "82MS", "350MS",
            "220", "100AU"
        ]
        
        # Check for model numbers
        if any(model in upper_text for model in valid_models):
            print(f"RESULT: APPROVED - Model {[m for m in valid_models if m in upper_text][0]} detected\n")
            return {
                "status": "approved",
                "reason": f"Authorized Casio model detected."
            }
        
        # Check for keywords: CASIO, FX, CW
        keywords = ["CASIO", "FX", "CW"]
        if any(keyword in upper_text for keyword in keywords):
            found = [k for k in keywords if k in upper_text]
            print(f"RESULT: APPROVED - Keywords {found} detected\n")
            return {
                "status": "approved",
                "reason": f"Casio calculator recognized ({', '.join(found)})."
            }
        
        print(f"RESULT: FLAGGED - No Casio indicators found\n")
        return {
            "status": "flagged",
            "reason": "No Casio calculator detected. Please show CASIO/FX label clearly."
        }
        
    except Exception as e:
        print(f"Calculator verification error: {e}")
        import traceback
        traceback.print_exc()
        print(f"RESULT: ERROR\n")
        return {
            "status": "flagged",
            "reason": "Verification error: Unable to process image"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
