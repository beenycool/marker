import {
  GradeCalculationResult,
  SubjectGradeBoundaries,
  ComponentGradeBoundaries,
} from '@/types/grade-boundaries';
import {
  gradeBoundariesData,
  getSubjectBoundaries,
  getComponentBoundaries,
} from './grade-boundaries-data';

export class GradeBoundariesService {
  /**
   * Calculate the grade for a given mark based on subject boundaries
   * @param subjectCode The subject code
   * @param mark The mark achieved
   * @returns Grade calculation result
   */
  static calculateGrade(
    subjectCode: string,
    mark: number
  ): GradeCalculationResult {
    const boundaries = getSubjectBoundaries(subjectCode);
    if (!boundaries) {
      throw new Error(`Subject boundaries not found for code: ${subjectCode}`);
    }

    return this.calculateGradeFromBoundaries(boundaries, mark);
  }

  /**
   * Calculate the grade for a given mark based on component boundaries
   * @param componentCode The component code
   * @param mark The mark achieved
   * @returns Grade calculation result
   */
  static calculateComponentGrade(
    componentCode: string,
    mark: number
  ): GradeCalculationResult {
    const boundaries = getComponentBoundaries(componentCode);
    if (!boundaries) {
      throw new Error(
        `Component boundaries not found for code: ${componentCode}`
      );
    }

    return this.calculateGradeFromBoundaries(boundaries, mark);
  }

  /**
   * Calculate grade from boundaries object
   * @param boundaries The grade boundaries
   * @param mark The mark achieved
   * @returns Grade calculation result
   */
  private static calculateGradeFromBoundaries(
    boundaries: SubjectGradeBoundaries | ComponentGradeBoundaries,
    mark: number
  ): GradeCalculationResult {
    // Validate inputs
    if (
      !boundaries ||
      !boundaries.boundaries ||
      boundaries.boundaries.length === 0
    ) {
      throw new Error('Invalid boundaries data');
    }

    if (mark < 0 || mark > boundaries.maxMark) {
      throw new Error(
        `Mark ${mark} is outside valid range 0-${boundaries.maxMark}`
      );
    }

    const { maxMark } = boundaries;
    const percentage = Math.round((mark / maxMark) * 100);

    // Find the appropriate grade
    let grade: number | null = null;
    let nextGradeBoundary: number | undefined;
    let previousGradeBoundary: number | undefined;

    // Sort boundaries by grade descending to find the highest achieved grade
    const sortedBoundaries = [...boundaries.boundaries]
      .filter(b => b.minMark <= boundaries.maxMark) // Validate boundary data
      .sort((a, b) => b.grade - a.grade);

    for (const boundary of sortedBoundaries) {
      if (mark >= boundary.minMark) {
        grade = boundary.grade;

        // Find next grade boundary (higher grade)
        const nextBoundary = sortedBoundaries.find(
          b => b.grade > boundary.grade
        );
        if (nextBoundary) {
          nextGradeBoundary = nextBoundary.minMark;
        }

        // Find previous grade boundary (lower grade)
        const prevBoundary = sortedBoundaries.find(
          b => b.grade < boundary.grade
        );
        if (prevBoundary) {
          previousGradeBoundary = prevBoundary.minMark;
        }

        break;
      }
    }

    // If no grade found, it's unclassified (U)
    if (grade === null) {
      grade = 0;
    }

    return {
      grade,
      percentage,
      mark,
      maxMark,
      nextGradeBoundary,
      previousGradeBoundary,
    };
  }

  /**
   * Get the grade boundaries for a subject
   * @param subjectCode The subject code
   * @returns Subject grade boundaries or undefined if not found
   */
  static getSubjectBoundaries(
    subjectCode: string
  ): SubjectGradeBoundaries | undefined {
    return getSubjectBoundaries(subjectCode);
  }

  /**
   * Get the grade boundaries for a component
   * @param componentCode The component code
   * @returns Component grade boundaries or undefined if not found
   */
  static getComponentBoundaries(
    componentCode: string
  ): ComponentGradeBoundaries | undefined {
    return getComponentBoundaries(componentCode);
  }

  /**
   * Get all available subjects
   * @returns Array of all subject grade boundaries
   */
  static getAllSubjects(): SubjectGradeBoundaries[] {
    return Object.values(gradeBoundariesData.subjects);
  }

  /**
   * Get subjects by tier (Foundation or Higher)
   * @param tier The tier ('F' or 'H')
   * @returns Array of subject grade boundaries for the specified tier
   */
  static getSubjectsByTier(tier: 'F' | 'H'): SubjectGradeBoundaries[] {
    return Object.values(gradeBoundariesData.subjects).filter(
      subject => subject.tier === tier
    );
  }

  /**
   * Get subjects by subject title (partial match)
   * @param title The subject title to search for
   * @returns Array of matching subject grade boundaries
   */
  static searchSubjectsByTitle(title: string): SubjectGradeBoundaries[] {
    const searchTerm = title.toLowerCase();
    return Object.values(gradeBoundariesData.subjects).filter(subject =>
      subject.subjectTitle.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Calculate how many marks needed for next grade
   * @param subjectCode The subject code
   * @param mark The current mark
   * @returns Marks needed for next grade, or null if already at highest grade or invalid subject
   */
  static marksToNextGrade(subjectCode: string, mark: number): number | null {
    try {
      const boundaries = getSubjectBoundaries(subjectCode);
      if (!boundaries) {
        return null;
      }

      // Sort boundaries by grade descending
      const sortedBoundaries = [...boundaries.boundaries].sort(
        (a, b) => b.grade - a.grade
      );

      let currentGrade = 0;

      // Find current grade
      for (const boundary of sortedBoundaries) {
        if (mark >= boundary.minMark) {
          currentGrade = boundary.grade;
          break;
        }
      }

      // If already at highest grade (9), return null
      if (currentGrade === 9) {
        return null;
      }

      // Find next grade boundary
      const nextBoundary = sortedBoundaries.find(
        b => b.grade === currentGrade + 1
      );

      if (!nextBoundary) {
        return null;
      }

      return Math.max(0, nextBoundary.minMark - mark);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get grade description
   * @param grade The grade number
   * @returns Human-readable grade description
   */
  static getGradeDescription(grade: number): string {
    switch (grade) {
      case 9:
        return 'Grade 9 (A*)';
      case 8:
        return 'Grade 8 (A/A*)';
      case 7:
        return 'Grade 7 (A)';
      case 6:
        return 'Grade 6 (B)';
      case 5:
        return 'Grade 5 (Strong Pass)';
      case 4:
        return 'Grade 4 (Standard Pass)';
      case 3:
        return 'Grade 3 (D/E)';
      case 2:
        return 'Grade 2 (E/F)';
      case 1:
        return 'Grade 1 (F/G)';
      case 0:
        return 'Unclassified (U)';
      default:
        return 'Invalid Grade';
    }
  }

  /**
   * Validate if a mark is within valid range for a subject
   * @param subjectCode The subject code
   * @param mark The mark to validate
   * @returns True if mark is valid, false otherwise
   */
  static validateMark(subjectCode: string, mark: number): boolean {
    const boundaries = getSubjectBoundaries(subjectCode);
    if (!boundaries) return false;

    return mark >= 0 && mark <= boundaries.maxMark;
  }

  /**
   * Get grade distribution for a subject
   * @param subjectCode The subject code
   * @returns Array of grade boundaries with descriptions
   */
  static getGradeDistribution(subjectCode: string) {
    const boundaries = getSubjectBoundaries(subjectCode);
    if (!boundaries) return null;

    return boundaries.boundaries.map(boundary => ({
      grade: boundary.grade,
      description: this.getGradeDescription(boundary.grade),
      minMark: boundary.minMark,
      maxMark: boundary.maxMark,
      percentage: Math.round((boundary.minMark / boundaries.maxMark) * 100),
    }));
  }
}
