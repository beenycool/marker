export interface GradeBoundary {
  grade: number;
  minMark: number;
  maxMark: number;
}

export interface SubjectGradeBoundaries {
  subjectCode: string;
  subjectTitle: string;
  maxMark: number;
  tier?: 'F' | 'H';
  boundaries: GradeBoundary[];
  isDoubleAward?: boolean; // For GCSE Double Award subjects like Combined Science
}

export interface ComponentGradeBoundaries {
  subjectCode: string;
  componentCode: string;
  componentTitle: string;
  maxMark: number;
  boundaries: GradeBoundary[];
}

export interface GradeBoundariesData {
  subjects: Record<string, SubjectGradeBoundaries>;
  components: Record<string, ComponentGradeBoundaries>;
}

export interface GradeCalculationResult {
  grade: number | null;
  percentage: number;
  mark: number;
  maxMark: number;
  nextGradeBoundary?: number;
  previousGradeBoundary?: number;
}
