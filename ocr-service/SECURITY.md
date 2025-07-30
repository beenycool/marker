# Security Update - PyTorch CTC Loss Vulnerability Fix

## Overview
This update addresses a denial of service vulnerability (CVE-2025-3730) in PyTorch's `torch.nn.functional.ctc_loss` function. The vulnerability affects PyTorch version 2.6.0 and earlier.

## Vulnerability Details
- **CVE ID**: CVE-2025-3730
- **Affected Function**: `torch.nn.functional.ctc_loss`
- **Affected File**: `aten/src/ATen/native/LossCTC.cpp`
- **Risk**: Denial of service when the function is manipulated
- **Attack Vector**: Local access required
- **Patch ID**: 46fc5d8e360127361211cb237d5f9eef0223e567

## Changes Made
- Updated PyTorch from version 2.1.2 to 2.7.0
- Updated TorchVision from version 0.16.2 to 0.18.0

## Verification
The updated PyTorch version (2.7.0) includes the patch that fixes the CTC loss vulnerability. This resolves the potential denial of service issue.

## References
- [PyTorch 2.7.0 Release Notes](https://github.com/pytorch/pytorch/releases/tag/v2.7.0)
- [CVE-2025-3730](https://nvd.nist.gov/vuln/detail/CVE-2025-3730)