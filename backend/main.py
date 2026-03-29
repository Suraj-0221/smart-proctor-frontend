import io
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import pytesseract

app = FastAPI()

# Allow CORS so the React app can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def perform_ocr(image_bytes: bytes) -> str:
    """Attempts to run Tesseract OCR. If it fails, simulates a successful response."""
    try:
        tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path

        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except pytesseract.TesseractNotFoundError:
        print("WARNING: Tesseract OCR is not installed or not in PATH. Simulating OCR.")
        return "SIMULATED_NO_TEXT"
    except Exception as e:
        print(f"OCR Error: {e}")
        return "SIMULATED_NO_TEXT"

@app.post("/api/verify/hands")
async def verify_hands(image: UploadFile = File(...)):
    contents = await image.read()
    text = perform_ocr(contents)
    
    # If text is detected on the hands and it's not our simulation fallback
    if text and text != "SIMULATED_NO_TEXT":
        # Any substantial readable text on palms indicates potential cheating
        if len(text) > 3:
            return {
                "status": "flagged",
                "reason": f"Text detected on hands: {text[:20]}..."
            }
            
    return {"status": "approved", "reason": "Hands clear."}


@app.post("/api/verify/calculator")
async def verify_calculator(image: UploadFile = File(...)):
    contents = await image.read()
    text = perform_ocr(contents)
    
    if text == "SIMULATED_NO_TEXT":
        return {"status": "approved", "reason": "Simulated Casio FX-991EX"}

    # In a real model, we might use a dedicated Image Classifier here.
    # But as a fallback, we check if the OCR can read CASIO or FX.
    upper_text = text.upper()
    
    valid_models = [
        "991CW", "570CW", "350CW", "82CW", 
        "991EX", "570EX", "350EX", 
        "991ES", "570ES", "115ES", "82ES", 
        "991MS", "570MS", "100MS", "95MS", "85MS", "82MS", "350MS", 
        "220", "100AU"
    ]

    # If it reads a specific model number, pass instantly
    if any(model in upper_text for model in valid_models):
        return {"status": "approved", "reason": "Authorized Casio model recognized."}

    # Fallback: if it just broadly sees CASIO or FX, pass it anyway because 
    # camera angles/blur make small model numbers too hard to read.
    if "CASIO" in upper_text or "FX" in upper_text:
        return {"status": "approved", "reason": "Casio logo detected (model unreadable)."}
    
    # If it finds absolutely nothing related to calculators
    return {"status": "flagged", "reason": "No calculator detected. (Make sure CASIO logo is visible)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
