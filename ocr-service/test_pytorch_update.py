#!/usr/bin/env python3
"""
Test script to verify PyTorch update and OCR service functionality
"""

import torch
import torchvision
import easyocr
import sys

def test_pytorch_version():
    """Test that PyTorch version is updated"""
    print(f"PyTorch version: {torch.__version__}")
    print(f"TorchVision version: {torchvision.__version__}")
    
    # Check that version is 2.7.0 or later
    major, minor, patch = torch.__version__.split('.')[:3]
    patch = patch.split('+')[0]  # Remove any additional info like +cu118
    
    if int(major) >= 2 and int(minor) >= 7:
        print("✓ PyTorch version is updated (2.7.0 or later)")
        return True
    else:
        print("✗ PyTorch version is not updated properly")
        return False

def test_easyocr_initialization():
    """Test that EasyOCR can be initialized"""
    try:
        reader = easyocr.Reader(['en'])
        print("✓ EasyOCR initialized successfully")
        return True
    except Exception as e:
        print(f"✗ EasyOCR initialization failed: {e}")
        return False

def test_ctc_loss_function():
    """Test that CTC loss function works without issues"""
    try:
        # Create sample data for CTC loss
        log_probs = torch.randn(50, 16, 20).log_softmax(2).detach().requires_grad_()
        targets = torch.randint(1, 20, (16, 30), dtype=torch.long)
        input_lengths = torch.full((16,), 50, dtype=torch.long)
        target_lengths = torch.randint(10, 30, (16,), dtype=torch.long)
        
        # Compute CTC loss
        loss = torch.nn.functional.ctc_loss(log_probs, targets, input_lengths, target_lengths)
        loss.backward()
        
        print("✓ CTC loss function works correctly")
        return True
    except Exception as e:
        print(f"✗ CTC loss function test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing PyTorch update and OCR service functionality...\n")
    
    tests = [
        test_pytorch_version,
        test_easyocr_initialization,
        test_ctc_loss_function
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"✗ Test {test.__name__} failed with exception: {e}")
            results.append(False)
        print()
    
    # Summary
    passed = sum(results)
    total = len(results)
    
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ All tests passed! The PyTorch update is successful.")
        return 0
    else:
        print("✗ Some tests failed. Please check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())