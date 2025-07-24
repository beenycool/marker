import { AnalyticsService } from '../analytics';

describe('AnalyticsService', () => {
  describe('calculateAverageScore', () => {
    it('should calculate average score correctly', () => {
      const scores = [80, 90, 70, 85, 95];
      const average = AnalyticsService.calculateAverageScore(scores);
      expect(average).toBe(84);
    });

    it('should return 0 for empty array', () => {
      const average = AnalyticsService.calculateAverageScore([]);
      expect(average).toBe(0);
    });

    it('should handle single score', () => {
      const average = AnalyticsService.calculateAverageScore([75]);
      expect(average).toBe(75);
    });
  });

  describe('calculateSubjectBreakdown', () => {
    it('should calculate subject breakdown correctly', () => {
      const submissions = [
        { subject: 'Mathematics' },
        { subject: 'Mathematics' },
        { subject: 'English' },
        { subject: 'Science' },
        { subject: 'Mathematics' },
      ];
      const breakdown = AnalyticsService.calculateSubjectBreakdown(submissions);
      expect(breakdown).toEqual({
        Mathematics: 3,
        English: 1,
        Science: 1,
      });
    });

    it('should handle empty submissions', () => {
      const breakdown = AnalyticsService.calculateSubjectBreakdown([]);
      expect(breakdown).toEqual({});
    });

    it('should handle null subjects', () => {
      const submissions = [
        { subject: null },
        { subject: 'Mathematics' },
        { subject: null },
      ];
      const breakdown = AnalyticsService.calculateSubjectBreakdown(submissions);
      expect(breakdown).toEqual({
        Other: 2,
        Mathematics: 1,
      });
    });
  });

  describe('calculateProgressOverTime', () => {
    it('should calculate progress over time correctly', () => {
      const submissions = [
        { created_at: '2025-01-01T10:00:00Z', feedback: [{ score: 70 }] },
        { created_at: '2025-01-01T11:00:00Z', feedback: [{ score: 80 }] },
        { created_at: '2025-01-02T10:00:00Z', feedback: [{ score: 85 }] },
        { created_at: '2025-01-03T10:00:00Z', feedback: [{ score: 90 }] },
      ];
      const progress = AnalyticsService.calculateProgressOverTime(submissions);
      expect(progress).toEqual([
        { date: '2025-01-01', score: 75, count: 2 },
        { date: '2025-01-02', score: 85, count: 1 },
        { date: '2025-01-03', score: 90, count: 1 },
      ]);
    });

    it('should handle empty submissions', () => {
      const progress = AnalyticsService.calculateProgressOverTime([]);
      expect(progress).toEqual([]);
    });

    it('should filter by date range', () => {
      const submissions = [
        { created_at: '2025-01-01T10:00:00Z', feedback: [{ score: 70 }] },
        { created_at: '2025-01-15T10:00:00Z', feedback: [{ score: 80 }] },
        { created_at: '2025-02-01T10:00:00Z', feedback: [{ score: 85 }] },
      ];
      const thirtyDaysAgo = new Date('2025-01-16');
      const progress = AnalyticsService.calculateProgressOverTime(
        submissions,
        thirtyDaysAgo
      );
      expect(progress).toEqual([
        { date: '2025-01-15', score: 80, count: 1 },
        { date: '2025-02-01', score: 85, count: 1 },
      ]);
    });
  });

  describe('calculateGradeDistribution', () => {
    it('should calculate grade distribution correctly', () => {
      const submissions = [
        { feedback: [{ grade: '9' }] },
        { feedback: [{ grade: '9' }] },
        { feedback: [{ grade: '8' }] },
        { feedback: [{ grade: '7' }] },
        { feedback: [{ grade: '9' }] },
      ];
      const distribution =
        AnalyticsService.calculateGradeDistribution(submissions);
      expect(distribution).toEqual({
        '9': 3,
        '8': 1,
        '7': 1,
      });
    });

    it('should handle empty submissions', () => {
      const distribution = AnalyticsService.calculateGradeDistribution([]);
      expect(distribution).toEqual({});
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should calculate all performance metrics', () => {
      const submissions = [
        {
          subject: 'Mathematics',
          created_at: '2025-01-01T10:00:00Z',
          feedback: [{ score: 80, grade: '7' }],
        },
        {
          subject: 'Mathematics',
          created_at: '2025-01-01T11:00:00Z',
          feedback: [{ score: 90, grade: '8' }],
        },
        {
          subject: 'English',
          created_at: '2025-01-02T10:00:00Z',
          feedback: [{ score: 70, grade: '6' }],
        },
      ];
      const metrics = AnalyticsService.getPerformanceMetrics(submissions);
      expect(metrics).toEqual({
        totalSubmissions: 3,
        averageScore: 80,
        subjectBreakdown: { Mathematics: 2, English: 1 },
        progressOverTime: [
          { date: '2025-01-01', score: 85, count: 2 },
          { date: '2025-01-02', score: 70, count: 1 },
        ],
        gradeDistribution: { '7': 1, '8': 1, '6': 1 },
      });
    });

    it('should handle empty submissions', () => {
      const metrics = AnalyticsService.getPerformanceMetrics([]);
      expect(metrics).toEqual({
        totalSubmissions: 0,
        averageScore: 0,
        subjectBreakdown: {},
        progressOverTime: [],
        gradeDistribution: {},
      });
    });
  });
});
