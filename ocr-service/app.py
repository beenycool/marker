#!/usr/bin/env python3
"""
EasyOCR Service for AIMARKER
A Flask-based OCR service using EasyOCR for handwritten and printed text recognition.
"""

import os
import io
import time
import logging
from typing import Dict, List, Any
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import easyocr
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global OCR reader instance (initialized on first use)
ocr_reader = None
supported_languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']

def get_ocr_reader(languages: List[str] = None) -> easyocr.Reader:
    """Get or initialize the OCR reader with specified languages."""
    global ocr_reader
    
    if languages is None:
        languages = ['en']
    
    # Validate languages
    valid_languages = [lang for lang in languages if lang in supported_languages]
    if not valid_languages:
        valid_languages = ['en']
    
    # Initialize reader if not exists or languages changed
    if ocr_reader is None:
        logger.info(f"Initializing EasyOCR reader with languages: {valid_languages}")
        try:
            ocr_reader = easyocr.Reader(
                valid_languages, 
                gpu=os.getenv('USE_GPU', 'false').lower() == 'true',
                download_enabled=True
            )
            logger.info("EasyOCR reader initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR reader: {e}")
            raise
    
    return ocr_reader

def validate_image(file_data: bytes, max_size: int = 5 * 1024 * 1024) -> Dict[str, Any]:
    """Validate uploaded image file."""
    if len(file_data) > max_size:
        return {"valid": False, "error": "File too large. Maximum size is 5MB."}
    
    try:
        # Try to open as image
        image = Image.open(io.BytesIO(file_data))
        
        # Check image format
        if image.format not in ['JPEG', 'PNG', 'GIF', 'WEBP', 'BMP']:
            return {"valid": False, "error": "Unsupported image format. Use JPG, PNG, GIF, WebP, or BMP."}
        
        # Check image dimensions
        width, height = image.size
        if width < 50 or height < 50:
            return {"valid": False, "error": "Image too small. Minimum size is 50x50 pixels."}
        
        if width > 4000 or height > 4000:
            return {"valid": False, "error": "Image too large. Maximum size is 4000x4000 pixels."}
        
        return {"valid": True, "format": image.format, "size": (width, height)}
        
    except Exception as e:
        return {"valid": False, "error": f"Invalid image file: {str(e)}"}

def preprocess_image(image_data: bytes) -> np.ndarray:
    """Preprocess image for better OCR results."""
    try:
        # Open image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        return image_array
        
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check() -> Response:
    """Health check endpoint."""
    try:
        # Check if OCR reader can be initialized
        reader = get_ocr_reader(['en'])
        
        return jsonify({
            "status": "healthy",
            "service": "EasyOCR Service",
            "version": "1.0.0",
            "supported_languages": supported_languages,
            "gpu_enabled": os.getenv('USE_GPU', 'false').lower() == 'true',
            "timestamp": time.time()
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }), 503

@app.route('/ocr', methods=['POST'])
def process_ocr() -> Response:
    """Process OCR on uploaded image."""
    start_time = time.time()
    
    try:
        # Check if image file is provided
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No image file selected"}), 400
        
        # Get languages from request (optional)
        languages_param = request.form.get('languages', '["en"]')
        try:
            import json
            languages = json.loads(languages_param)
            if not isinstance(languages, list):
                languages = ['en']
        except:
            languages = ['en']
        
        # Read file data
        file_data = file.read()
        
        # Validate image
        validation = validate_image(file_data)
        if not validation["valid"]:
            return jsonify({"error": validation["error"]}), 400
        
        logger.info(f"Processing OCR for image: {file.filename}, size: {len(file_data)} bytes")
        
        # Preprocess image
        image_array = preprocess_image(file_data)
        
        # Get OCR reader
        reader = get_ocr_reader(languages)
        
        # Perform OCR
        ocr_start = time.time()
        results = reader.readtext(image_array)
        ocr_time = time.time() - ocr_start
        
        # Process results
        if not results:
            return jsonify({
                "text": "",
                "confidence": 0.0,
                "processingTime": int((time.time() - start_time) * 1000),
                "regions": 0,
                "language": languages[0] if languages else "en",
                "message": "No text detected in image"
            }), 200
        
        # Extract text and calculate average confidence
        extracted_text = []
        total_confidence = 0
        
        for (bbox, text, confidence) in results:
            if confidence > 0.1:  # Filter out low-confidence detections
                extracted_text.append(text)
                total_confidence += confidence
        
        if not extracted_text:
            return jsonify({
                "text": "",
                "confidence": 0.0,
                "processingTime": int((time.time() - start_time) * 1000),
                "regions": 0,
                "language": languages[0] if languages else "en",
                "message": "No readable text found with sufficient confidence"
            }), 200
        
        # Combine text and calculate metrics
        combined_text = ' '.join(extracted_text)
        avg_confidence = total_confidence / len(extracted_text)
        total_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"OCR completed: {len(extracted_text)} regions, {avg_confidence:.2f} confidence, {total_time}ms")
        
        return jsonify({
            "text": combined_text,
            "confidence": round(avg_confidence, 3),
            "processingTime": total_time,
            "regions": len(extracted_text),
            "language": languages[0] if languages else "en",
            "metadata": {
                "ocrTime": int(ocr_time * 1000),
                "imageSize": validation.get("size"),
                "imageFormat": validation.get("format"),
                "detectedRegions": len(results),
                "filteredRegions": len(extracted_text)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        return jsonify({
            "error": f"OCR processing failed: {str(e)}",
            "processingTime": int((time.time() - start_time) * 1000)
        }), 500

@app.route('/languages', methods=['GET'])
def get_supported_languages() -> Response:
    """Get list of supported languages."""
    return jsonify({
        "supported_languages": supported_languages,
        "default": "en",
        "description": "ISO 639-1 language codes supported by EasyOCR"
    }), 200

@app.errorhandler(413)
def file_too_large(error):
    """Handle file too large error."""
    return jsonify({"error": "File too large. Maximum size is 5MB."}), 413

@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Configuration
    host = os.getenv('OCR_HOST', '0.0.0.0')
    port = int(os.getenv('OCR_PORT', 8080))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    
    # Set upload limits
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB
    
    logger.info(f"Starting EasyOCR service on {host}:{port}")
    logger.info(f"GPU enabled: {os.getenv('USE_GPU', 'false')}")
    logger.info(f"Supported languages: {supported_languages}")
    
    # Initialize OCR reader on startup for faster first request
    try:
        get_ocr_reader(['en'])
        logger.info("OCR reader pre-initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to pre-initialize OCR reader: {e}")
    
    app.run(host=host, port=port, debug=debug, threaded=True)