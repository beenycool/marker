# Enhanced Rate Limiting Tests

This document describes the improved rate limiting test suite that replaces the fixed timeout and hardcoded request limits with dynamic, adaptive testing.

## Overview

The original rate limiting test in `e2e/usage-flow.spec.ts` had several issues:
- Fixed 5000ms timeout that could cause false negatives
- Hardcoded 10 request limit without verification of actual threshold
- No assertions to verify exact rate limiting behavior
- No adaptation to server response times

## Improvements

### 1. Dynamic Configuration
- **Environment Variables**: All test parameters can be configured via environment variables
- **Adaptive Timing**: Response times are measured and used to adjust delays between requests
- **Parameterized Limits**: Request limits are configurable based on environment

### 2. Enhanced Test Structure
- **RateLimitTestHelper**: A utility class for consistent rate limit testing
- **Metrics Collection**: Detailed metrics including response times and thresholds
- **Recovery Testing**: Tests for rate limit reset behavior
- **Header Verification**: Checks for standard rate limit headers

### 3. Better Assertions
- **Exact Threshold Verification**: Confirms the exact number of requests before rate limiting
- **Response Time Validation**: Ensures response times are within acceptable ranges
- **Error Message Validation**: Verifies rate limit error messages are appropriate

## Files Created

### `e2e/test-config.ts`
- **RateLimitTestConfig**: Configuration interface for rate limit tests
- **RateLimitMetrics**: Interface for collected metrics
- **RateLimitTestHelper**: Main utility class for rate limit testing
- **EnvironmentRateLimitConfig**: Environment-based configuration

### `e2e/usage-flow-enhanced.spec.ts`
- Comprehensive rate limiting test suite with 4 test scenarios:
  1. **Anonymous rate limiting with dynamic configuration**
  2. **Rate limiting with adaptive timing**
  3. **Parameterized rate limiting with environment variables**
  4. **Rate limit recovery and reset behavior**

## Usage

### Basic Usage
```typescript
import { RateLimitTestHelper, rateLimitConfig } from './test-config';

const testHelper = new RateLimitTestHelper(rateLimitConfig);
const metrics = await testHelper.executeRateLimitTest(page);
testHelper.logMetrics(metrics);
```

### Environment Configuration
```bash
# Set custom rate limit test parameters
export RATE_LIMIT_MAX_REQUESTS=12
export RATE_LIMIT_DELAY=750
export RATE_LIMIT_TIMEOUT=20000
export RATE_LIMIT_MIN_DELAY=300
export RATE_LIMIT_MAX_DELAY=3000
```

### Custom Configuration
```typescript
const customConfig = {
  maxTestRequests: 15,
  requestDelay: 1000,
  timeout: 20000,
  minDelay: 500,
  maxDelay: 3000,
};

const testHelper = new RateLimitTestHelper(customConfig);
```

## Test Scenarios

### 1. Dynamic Threshold Detection
The tests automatically detect the actual rate limit threshold by:
- Making requests until rate limiting occurs
- Recording the exact request count when rate limited
- Validating the threshold is within expected ranges

### 2. Response Time Monitoring
- Measures response times for each request
- Calculates average, min, and max response times
- Ensures response times are reasonable (< 10 seconds)

### 3. Recovery Testing
- Tests rate limit reset behavior
- Verifies functionality returns after reset period
- Configurable reset wait time

### 4. Environment Adaptation
- Tests adapt to different environments (dev, staging, prod)
- Configurable parameters for different deployment contexts
- Graceful handling of varying server response times

## Migration from Original Tests

### Original Test Issues
```typescript
// ❌ Original problematic code
for (let i = 0; i < 10; i++) {
  await page.goto('/mark');
  // ... form filling ...
  try {
    await page.waitForSelector('[data-testid="feedback-result"]', { timeout: 5000 });
  } catch {
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
    break;
  }
}
```

### Improved Test
```typescript
// ✅ Improved with RateLimitTestHelper
const testHelper = new RateLimitTestHelper(rateLimitConfig);
const metrics = await testHelper.executeRateLimitTest(page);

expect(metrics.successfulRequests).toBeGreaterThan(0);
expect(metrics.rateLimitTriggered).toBe(true);
expect(metrics.rateLimitThreshold).toBeDefined();
```

## Running Tests

### Standard Run
```bash
npm run test:e2e
```

### With Custom Configuration
```bash
RATE_LIMIT_MAX_REQUESTS=15 RATE_LIMIT_DELAY=1000 npm run test:e2e
```

### Specific Test File
```bash
npx playwright test e2e/usage-flow-enhanced.spec.ts
```

## Debugging

### Enable Verbose Logging
```typescript
const testHelper = new RateLimitTestHelper({
  ...rateLimitConfig,
  maxTestRequests: 5, // Smaller for debugging
});

testHelper.logMetrics(metrics);
```

### Check Rate Limit Headers
```typescript
await testHelper.verifyRateLimitHeaders(response);
```

## Best Practices

1. **Use Environment Variables**: Always use environment variables for configuration
2. **Monitor Response Times**: Check response times are reasonable for your environment
3. **Test Recovery**: Always test rate limit reset behavior
4. **Validate Thresholds**: Ensure rate limit thresholds match expectations
5. **Handle Failures Gracefully**: Tests should fail gracefully when rate limits are unexpected

## Troubleshooting

### Common Issues

1. **Tests Timing Out**
   - Increase `RATE_LIMIT_TIMEOUT` environment variable
   - Check server response times in logs

2. **Rate Limit Not Triggering**
   - Increase `RATE_LIMIT_MAX_REQUESTS`
   - Check if rate limiting is enabled in test environment

3. **False Positives**
   - Verify rate limit headers are present
   - Check error messages match expected format

### Debug Mode
```bash
DEBUG=1 RATE_LIMIT_MAX_REQUESTS=3 npm run test:e2e
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run rate limit tests
  run: npm run test:e2e
  env:
    RATE_LIMIT_MAX_REQUESTS: 8
    RATE_LIMIT_TIMEOUT: 20000
    RATE_LIMIT_DELAY: 1000