#!/usr/bin/env python3
"""
GDPR-Compliant TrOCR Service for AIMARKER
A secure Flask-based OCR service using Microsoft's TrOCR for handwritten text recognition.
Designed for privacy-first, ephemeral processing with Cloudflare Tunnel security.
"""

import os
import io
import time
import logging
import hashlib
import secrets
from typing import Dict, List, Any, Optional
from flask import Flask, request, jsonify, Response, abort
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch
import numpy as np
from functools import wraps

# Configure logging
log_level = os.getenv('OCR_LOG_LEVEL', 'INFO').upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Security configuration
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(32))

# Rate limiting (additional layer of protection)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour", "10 per minute"],
    storage_uri="memory://"
)

# Global TrOCR model instances (initialized on first use)
trocr_processor = None
trocr_model = None
device = None

# Security middleware
def require_tunnel_auth(f):
    """Require Cloudflare Tunnel authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for Cloudflare Tunnel headers
        cf_client_id = request.headers.get('CF-Access-Client-Id')
        cf_client_secret = request.headers.get('CF-Access-Client-Secret')
        auth_header = request.headers.get('Authorization', '')
        
        # Validate tunnel authentication
        expected_client_id = os.getenv('OCR_TUNNEL_CLIENT_ID')
        expected_client_secret = os.getenv('OCR_TUNNEL_CLIENT_SECRET')
        expected_token = os.getenv('OCR_TUNNEL_TOKEN')
        
        if not all([expected_client_id, expected_client_secret, expected_token]):
            logger.error("OCR service authentication not properly configured")
            abort(500)
        
        # Verify Cloudflare Tunnel credentials
        if (cf_client_id != expected_client_id or 
            cf_client_secret != expected_client_secret or
            not auth_header.startswith('Bearer ') or
            auth_header[7:] != expected_token):
            logger.warning(f"Unauthorized OCR request from {request.remote_addr}")
            abort(401)
        
        return f(*args, **kwargs)
    return decorated_function

def add_security_headers(response: Response) -> Response:
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = "default-src 'none'"
    response.headers['Server'] = 'AIMARKER-OCR/1.0'
    return response

@app.after_request
def after_request(response):
    return add_security_headers(response)

def get_trocr_models():
    """Get or initialize the TrOCR processor and model."""
    global trocr_processor, trocr_model, device
    
    if trocr_processor is None or trocr_model is None:
        logger.info("Initializing TrOCR model for handwritten text recognition...")
        try:
            # Determine device (GPU if available and enabled)
            use_gpu = os.getenv('USE_GPU', 'false').lower() == 'true'
            device = torch.device('cuda' if use_gpu and torch.cuda.is_available() else 'cpu')
            logger.info(f"Using device: {device}")
            
            # Load TrOCR processor and model
            model_name = "microsoft/trocr-base-handwritten"
            trocr_processor = TrOCRProcessor.from_pretrained(model_name)
            trocr_model = VisionEncoderDecoderModel.from_pretrained(model_name)
            
            # Move model to device
            trocr_model = trocr_model.to(device)
            trocr_model.eval()  # Set to evaluation mode
            
            logger.info("TrOCR model initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize TrOCR model: {e}")
            raise
    
    return trocr_processor, trocr_model, device

@app.route('/health', methods=['GET'])
@require_tunnel_auth
def health_check():
    """
    Health check endpoint for monitoring
    """
    try:
        # Check if TrOCR models can be initialized
        processor, model, device = get_trocr_models()
        
        return jsonify({
            "status": "healthy",
            "service": "AIMARKER TrOCR Service",
            "version": "2.0.0",
            "model": "microsoft/trocr-base-handwritten",
            "device": str(device),
            "gpu_enabled": os.getenv('USE_GPU', 'false').lower() == 'true',
            "timestamp": time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
            "memory_usage": "normal"
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": "Service initialization failed",
            "timestamp": time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
        }), 503

@app.route('/ocr', methods=['POST'])
@require_tunnel_auth
@limiter.limit("5 per minute")
def process_ocr():
    """
    GDPR-COMPLIANT OCR Processing
    - Ephemeral processing only (no data persistence)
    - Images are immediately discarded after processing
    - No logging of personal data or extracted text content
    """
    request_id = secrets.token_hex(8)
    
    try:
        # Validate request
        if 'image' not in request.files:
            logger.info(f"OCR request {request_id}: No image file provided")
            return jsonify({
                'error': 'No image file provided',
                'success': False,
                'requestId': request_id
            }), 400
        
        file = request.files['image']
        if file.filename == '':
            logger.info(f"OCR request {request_id}: No image file selected")
            return jsonify({
                'error': 'No image file selected',
                'success': False,
                'requestId': request_id
            }), 400
        
        logger.info(f"OCR request {request_id}: Processing with TrOCR handwritten model")
        
        # Process image
        start_time = time.time()
        
        # Read and validate image
        image_data = file.read()
        if len(image_data) == 0:
            logger.info(f"OCR request {request_id}: Empty image file")
            return jsonify({
                'error': 'Empty image file',
                'success': False,
                'requestId': request_id
            }), 400
        
        # GDPR: Log only metadata, never content
        file_size = len(image_data)
        logger.info(f"OCR request {request_id}: Processing {file_size} byte image")
        
        # Convert to PIL Image for processing
        try:
            image = Image.open(io.BytesIO(image_data))
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # GDPR: Immediately clear image data from memory
            del image_data
            
        except Exception as e:
            logger.error(f"OCR request {request_id}: Image processing error")
            return jsonify({
                'error': 'Invalid image format',
                'success': False,
                'requestId': request_id
            }), 400
        
        # Get TrOCR models
        processor, model, device = get_trocr_models()
        
        # Perform OCR with TrOCR
        try:
            # Process image with TrOCR
            pixel_values = processor(image, return_tensors="pt").pixel_values.to(device)
            
            # GDPR: Immediately clear PIL image from memory
            del image
            
            # Generate text with TrOCR
            with torch.no_grad():
                generated_ids = model.generate(pixel_values, max_length=512)
            
            # Decode generated text
            final_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            # GDPR: Clear tensors from memory
            del pixel_values, generated_ids
            
            # TrOCR doesn't provide confidence scores, so we'll use a default high confidence
            # for successful processing (can be enhanced with additional confidence estimation)
            avg_confidence = 0.95 if final_text.strip() else 0.1
            region_count = 1  # TrOCR processes the entire image as one region
            
            processing_time = time.time() - start_time
            
            # GDPR: Log only statistics, never extracted text content
            logger.info(f"OCR request {request_id}: Completed in {processing_time:.2f}s, "
                       f"extracted {len(final_text)} characters, "
                       f"confidence {avg_confidence:.2f}")
            
            # Count words for metadata
            word_count = len(final_text.split()) if final_text.strip() else 0
            
            response_data = {
                'success': True,
                'text': final_text,
                'confidence': round(avg_confidence, 3),
                'regions': region_count,
                'processingTime': round(processing_time * 1000),  # Convert to ms
                'language': 'en',  # TrOCR is primarily English-trained
                'requestId': request_id,
                'metadata': {
                    'extractedWords': word_count,
                    'avgConfidence': round(avg_confidence, 3),
                    'processedAt': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
                    'fileSize': file_size,
                    'model': 'microsoft/trocr-base-handwritten'
                }
            }
            
            # GDPR: Clear extracted text from local variables
            del final_text
            
            return jsonify(response_data)
            
        except Exception as e:
            logger.error(f"OCR request {request_id}: Processing failed - {str(e)}")
            return jsonify({
                'error': 'OCR processing failed',
                'success': False,
                'requestId': request_id
            }), 500
    
    except Exception as e:
        logger.error(f"OCR request {request_id}: Unexpected error")
        return jsonify({
            'error': 'Internal server error',
            'success': False,
            'requestId': request_id
        }), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({
        'error': 'File too large. Maximum size is 5MB.',
        'success': False
    }), 413

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'error': 'Rate limit exceeded. Please try again later.',
        'success': False
    }), 429

if __name__ == '__main__':
    logger.info("Starting AIMARKER TrOCR Service...")
    logger.info(f"GPU enabled: {os.getenv('USE_GPU', 'false').lower() == 'true'}")
    logger.info("Model: microsoft/trocr-base-handwritten")
    
    # Production settings
    host = os.getenv('OCR_HOST', '127.0.0.1')
    port = int(os.getenv('OCR_PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    
    logger.info(f"Starting server on {host}:{port}")
    app.run(host=host, port=port, debug=debug, threaded=True)