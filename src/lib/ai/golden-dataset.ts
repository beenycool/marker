import { logger } from '../logger';
import { getSupabase } from '../supabase';
import { MarkingRequest, MarkingResponse } from '@/types';

export interface GoldenTestCase {
  id: string;
  name: string;
  subject: string;
  exam_board: string;
  question: string;
  student_answer: string;
  expected_score_min: number;
  expected_score_max: number;
  expected_grade: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  created_at: string;
  created_by: string;
}

export interface TestResult {
  test_case_id: string;
  prompt_version: string;
  ai_provider: string;
  score: number;
  grade: string;
  feedback: string;
  passed: boolean;
  execution_time_ms: number;
  error_message?: string;
  timestamp: string;
}

export interface PromptPerformanceReport {
  prompt_version: string;
  total_tests: number;
  passed_tests: number;
  pass_rate: number;
  average_score: number;
  average_execution_time: number;
  performance_by_difficulty: {
    easy: { pass_rate: number; avg_score: number };
    medium: { pass_rate: number; avg_score: number };
    hard: { pass_rate: number; avg_score: number };
  };
  performance_by_subject: Record<
    string,
    { pass_rate: number; avg_score: number }
  >;
  failed_tests: TestResult[];
}

export class GoldenDatasetManager {
  private supabase: any;

  constructor() {
    this.initSupabase();
  }

  private async initSupabase() {
    this.supabase = await getSupabase();
  }

  /**
   * Create a new golden test case
   */
  async createTestCase(
    testCase: Omit<GoldenTestCase, 'id' | 'created_at'>
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('golden_test_cases')
        .insert({
          ...testCase,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      logger.info(`Created golden test case: ${data.id}`);
      return data.id;
    } catch (error) {
      logger.error('Error creating golden test case:', error);
      throw new Error(`Failed to create test case: ${error}`);
    }
  }

  /**
   * Get all golden test cases
   */
  async getAllTestCases(): Promise<GoldenTestCase[]> {
    try {
      const { data, error } = await this.supabase
        .from('golden_test_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching golden test cases:', error);
      throw new Error(`Failed to fetch test cases: ${error}`);
    }
  }

  /**
   * Get test cases by subject or difficulty
   */
  async getTestCases(filters: {
    subject?: string;
    difficulty?: string;
    limit?: number;
  }): Promise<GoldenTestCase[]> {
    try {
      let query = this.supabase.from('golden_test_cases').select('*');

      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }

      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching filtered test cases:', error);
      throw new Error(`Failed to fetch test cases: ${error}`);
    }
  }

  /**
   * Run a single test case against a prompt
   */
  async runTestCase(
    testCase: GoldenTestCase,
    markingFunction: (request: MarkingRequest) => Promise<MarkingResponse>,
    promptVersion: string,
    aiProvider: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const request: MarkingRequest = {
        question: testCase.question,
        answer: testCase.student_answer,
        subject: testCase.subject,
        examBoard: testCase.exam_board,
      };

      const response = await markingFunction(request);
      const executionTime = Date.now() - startTime;

      const passed = this.evaluateTestResult(testCase, response);

      const result: TestResult = {
        test_case_id: testCase.id,
        prompt_version: promptVersion,
        ai_provider: aiProvider,
        score: response.score,
        grade: response.grade,
        feedback: response.aiResponse,
        passed,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
      };

      // Store the test result
      await this.storeTestResult(result);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: TestResult = {
        test_case_id: testCase.id,
        prompt_version: promptVersion,
        ai_provider: aiProvider,
        score: 0,
        grade: 'U',
        feedback: '',
        passed: false,
        execution_time_ms: executionTime,
        error_message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };

      await this.storeTestResult(result);
      return result;
    }
  }

  /**
   * Run all test cases against a prompt version
   */
  async runFullTestSuite(
    markingFunction: (request: MarkingRequest) => Promise<MarkingResponse>,
    promptVersion: string,
    aiProvider: string
  ): Promise<PromptPerformanceReport> {
    try {
      const testCases = await this.getAllTestCases();
      const results: TestResult[] = [];

      logger.info(
        `Running ${testCases.length} test cases for prompt ${promptVersion}`
      );

      // Run tests in batches to avoid overwhelming the AI provider
      const batchSize = 5;
      for (let i = 0; i < testCases.length; i += batchSize) {
        const batch = testCases.slice(i, i + batchSize);
        const batchPromises = batch.map(testCase =>
          this.runTestCase(testCase, markingFunction, promptVersion, aiProvider)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches
        if (i + batchSize < testCases.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return this.generatePerformanceReport(promptVersion, results, testCases);
    } catch (error) {
      logger.error('Error running full test suite:', error);
      throw new Error(`Failed to run test suite: ${error}`);
    }
  }

  /**
   * Compare two prompt versions
   */
  async comparePromptVersions(
    versionA: string,
    versionB: string
  ): Promise<{
    versionA: PromptPerformanceReport;
    versionB: PromptPerformanceReport;
    winner: string;
    improvement: number;
  }> {
    try {
      const [resultsA, resultsB] = await Promise.all([
        this.getTestResults(versionA),
        this.getTestResults(versionB),
      ]);

      const testCases = await this.getAllTestCases();
      const reportA = this.generatePerformanceReport(
        versionA,
        resultsA,
        testCases
      );
      const reportB = this.generatePerformanceReport(
        versionB,
        resultsB,
        testCases
      );

      const winner =
        reportA.pass_rate > reportB.pass_rate ? versionA : versionB;
      const improvement = Math.abs(reportA.pass_rate - reportB.pass_rate);

      return {
        versionA: reportA,
        versionB: reportB,
        winner,
        improvement,
      };
    } catch (error) {
      logger.error('Error comparing prompt versions:', error);
      throw new Error(`Failed to compare versions: ${error}`);
    }
  }

  /**
   * Get the current production prompt performance baseline
   */
  async getProductionBaseline(): Promise<PromptPerformanceReport | null> {
    try {
      // Get the currently active prompt version
      const { data: activePrompt } = await this.supabase
        .from('prompt_versions')
        .select('version')
        .eq('is_active', true)
        .single();

      if (!activePrompt) return null;

      const results = await this.getTestResults(activePrompt.version);
      const testCases = await this.getAllTestCases();

      return this.generatePerformanceReport(
        activePrompt.version,
        results,
        testCases
      );
    } catch (error) {
      logger.error('Error getting production baseline:', error);
      return null;
    }
  }

  private evaluateTestResult(
    testCase: GoldenTestCase,
    response: MarkingResponse
  ): boolean {
    // Check if score is within expected range
    const scoreInRange =
      response.score >= testCase.expected_score_min &&
      response.score <= testCase.expected_score_max;

    // Check if grade matches (allow for close grades)
    const gradeMatches =
      response.grade === testCase.expected_grade ||
      this.isCloseGrade(response.grade, testCase.expected_grade);

    return scoreInRange && gradeMatches;
  }

  private isCloseGrade(actual: string, expected: string): boolean {
    const gradeOrder = ['U', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'A*'];
    const actualIndex = gradeOrder.indexOf(actual);
    const expectedIndex = gradeOrder.indexOf(expected);

    // Allow grades within 1 level of each other
    return Math.abs(actualIndex - expectedIndex) <= 1;
  }

  private async storeTestResult(result: TestResult): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('golden_test_results')
        .insert(result);

      if (error) throw error;
    } catch (error) {
      logger.error('Error storing test result:', error);
    }
  }

  private async getTestResults(promptVersion: string): Promise<TestResult[]> {
    try {
      const { data, error } = await this.supabase
        .from('golden_test_results')
        .select('*')
        .eq('prompt_version', promptVersion)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching test results:', error);
      return [];
    }
  }

  private generatePerformanceReport(
    promptVersion: string,
    results: TestResult[],
    testCases: GoldenTestCase[]
  ): PromptPerformanceReport {
    const passedTests = results.filter(r => r.passed);
    const failedTests = results.filter(r => !r.passed);

    const performanceByDifficulty = {
      easy: this.calculateDifficultyStats(results, testCases, 'easy'),
      medium: this.calculateDifficultyStats(results, testCases, 'medium'),
      hard: this.calculateDifficultyStats(results, testCases, 'hard'),
    };

    const performanceBySubject: Record<
      string,
      { pass_rate: number; avg_score: number }
    > = {};
    const subjects = [...new Set(testCases.map(tc => tc.subject))];

    subjects.forEach(subject => {
      performanceBySubject[subject] = this.calculateSubjectStats(
        results,
        testCases,
        subject
      );
    });

    return {
      prompt_version: promptVersion,
      total_tests: results.length,
      passed_tests: passedTests.length,
      pass_rate: results.length > 0 ? passedTests.length / results.length : 0,
      average_score:
        results.length > 0
          ? results.reduce((sum, r) => sum + r.score, 0) / results.length
          : 0,
      average_execution_time:
        results.length > 0
          ? results.reduce((sum, r) => sum + r.execution_time_ms, 0) /
            results.length
          : 0,
      performance_by_difficulty: performanceByDifficulty,
      performance_by_subject: performanceBySubject,
      failed_tests: failedTests,
    };
  }

  private calculateDifficultyStats(
    results: TestResult[],
    testCases: GoldenTestCase[],
    difficulty: string
  ): { pass_rate: number; avg_score: number } {
    const relevantTestCases = testCases.filter(
      tc => tc.difficulty === difficulty
    );
    const relevantResults = results.filter(r =>
      relevantTestCases.some(tc => tc.id === r.test_case_id)
    );

    if (relevantResults.length === 0) {
      return { pass_rate: 0, avg_score: 0 };
    }

    const passedCount = relevantResults.filter(r => r.passed).length;
    const avgScore =
      relevantResults.reduce((sum, r) => sum + r.score, 0) /
      relevantResults.length;

    return {
      pass_rate: passedCount / relevantResults.length,
      avg_score: avgScore,
    };
  }

  private calculateSubjectStats(
    results: TestResult[],
    testCases: GoldenTestCase[],
    subject: string
  ): { pass_rate: number; avg_score: number } {
    const relevantTestCases = testCases.filter(tc => tc.subject === subject);
    const relevantResults = results.filter(r =>
      relevantTestCases.some(tc => tc.id === r.test_case_id)
    );

    if (relevantResults.length === 0) {
      return { pass_rate: 0, avg_score: 0 };
    }

    const passedCount = relevantResults.filter(r => r.passed).length;
    const avgScore =
      relevantResults.reduce((sum, r) => sum + r.score, 0) /
      relevantResults.length;

    return {
      pass_rate: passedCount / relevantResults.length,
      avg_score: avgScore,
    };
  }
}

export const goldenDataset = new GoldenDatasetManager();
