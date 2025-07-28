import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { goldenDataset } from '@/lib/ai/golden-dataset';
import { enhancedAIRouter } from '@/lib/ai/enhanced-router';
import { MarkingRequest } from '@/types';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    const {
      promptVersion,
      aiProvider,
      testCaseIds, // Optional: specific test cases to run
      runFullSuite = false,
    } = body;

    if (!promptVersion) {
      return NextResponse.json(
        { error: 'Prompt version is required' },
        { status: 400 }
      );
    }

    // Create a marking function that uses the specified prompt version
    const markingFunction = async (request: MarkingRequest) => {
      // Here you would modify the request to use the specific prompt version
      // For now, we'll use the enhanced router
      const result = await enhancedAIRouter.mark(request, 'PRO', aiProvider);
      // Return the full MarkingResponse without metadata
      const { metadata, ...markingResponse } = result;
      return markingResponse;
    };

    let results;

    if (runFullSuite) {
      // Run the complete test suite
      logger.info(
        `Running full golden dataset test suite for prompt ${promptVersion}`
      );
      results = await goldenDataset.runFullTestSuite(
        markingFunction,
        promptVersion,
        aiProvider || 'enhanced-router'
      );
    } else if (testCaseIds && testCaseIds.length > 0) {
      // Run specific test cases
      logger.info(
        `Running ${testCaseIds.length} test cases for prompt ${promptVersion}`
      );
      const testCases = await goldenDataset.getAllTestCases();
      const selectedTestCases = testCases.filter(tc =>
        testCaseIds.includes(tc.id)
      );

      const testResults = [];
      for (const testCase of selectedTestCases) {
        const result = await goldenDataset.runTestCase(
          testCase,
          markingFunction,
          promptVersion,
          aiProvider || 'enhanced-router'
        );
        testResults.push(result);
      }

      // Generate a mini report
      const passedTests = testResults.filter(r => r.passed);
      results = {
        prompt_version: promptVersion,
        total_tests: testResults.length,
        passed_tests: passedTests.length,
        pass_rate:
          testResults.length > 0 ? passedTests.length / testResults.length : 0,
        average_score:
          testResults.length > 0
            ? testResults.reduce((sum, r) => sum + r.score, 0) /
              testResults.length
            : 0,
        test_results: testResults,
      };
    } else {
      return NextResponse.json(
        {
          error:
            'Either runFullSuite must be true or testCaseIds must be provided',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error('Error running golden dataset test:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run test' },
      { status: 500 }
    );
  }
}
