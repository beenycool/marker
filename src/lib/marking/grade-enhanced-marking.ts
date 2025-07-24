import { GradeBoundariesService } from '@/lib/grade-boundaries-service';
import { MarkingResponse } from '@/types';

export interface EnhancedMarkingResponse extends MarkingResponse {
  gradeBoundaries?: {
    calculatedGrade: number;
    gradeDescription: string;
    percentage: number;
    maxMark: number;
    marksToNextGrade?: number;
    gradeDistribution: Array<{
      grade: number;
      description: string;
      minMark: number;
      percentage: number;
    }>;
  };
}

export class GradeEnhancedMarkingService {
  /**
   * Enhances a marking response with grade boundary information
   */
  static async enhanceWithGradeBoundaries(
    markingResponse: MarkingResponse,
    subjectCode: string
  ): Promise<EnhancedMarkingResponse> {
    try {
      // Validate the subject code and get grade boundaries
      const boundaries =
        GradeBoundariesService.getSubjectBoundaries(subjectCode);

      if (!boundaries) {
        return { ...markingResponse };
      }

      // Calculate grade based on the score
      const score = markingResponse.score;
      const gradeResult = GradeBoundariesService.calculateGrade(
        subjectCode,
        score
      );

      // Get marks needed for next grade
      const marksToNextGrade = GradeBoundariesService.marksToNextGrade(
        subjectCode,
        score
      );

      // Get full grade distribution
      const gradeDistribution =
        GradeBoundariesService.getGradeDistribution(subjectCode) || [];

      return {
        ...markingResponse,
        gradeBoundaries: {
          calculatedGrade: gradeResult.grade ?? 0,
          gradeDescription: gradeResult.grade
            ? GradeBoundariesService.getGradeDescription(gradeResult.grade)
            : 'Unclassified (U)',
          percentage: gradeResult.percentage,
          maxMark: gradeResult.maxMark,
          marksToNextGrade: marksToNextGrade ?? undefined,
          gradeDistribution,
        },
      };
    } catch (error) {
      return { ...markingResponse };
    }
  }

  /**
   * Gets available subjects for grade boundaries
   */
  static getAvailableSubjects() {
    return GradeBoundariesService.getAllSubjects();
  }

  /**
   * Searches subjects by title
   */
  static searchSubjects(query: string) {
    return GradeBoundariesService.searchSubjectsByTitle(query);
  }

  /**
   * Validates if a subject code has grade boundaries
   */
  static hasGradeBoundaries(subjectCode: string): boolean {
    return GradeBoundariesService.getSubjectBoundaries(subjectCode) !== null;
  }

  /**
   * Gets grade information for a specific mark
   */
  static getGradeInfo(subjectCode: string, mark: number) {
    return GradeBoundariesService.calculateGrade(subjectCode, mark);
  }
}
