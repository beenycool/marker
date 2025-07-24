import { GradeBoundariesService } from '../grade-boundaries-service';

describe('GradeBoundariesService', () => {
  describe('calculateGrade', () => {
    it('should calculate grade 9 for high marks', () => {
      const result = GradeBoundariesService.calculateGrade('8700', 150);
      expect(result.grade).toBe(9);
      expect(result.percentage).toBe(94);
      expect(result.mark).toBe(150);
      expect(result.maxMark).toBe(160);
    });

    it('should calculate grade 4 for borderline marks', () => {
      const result = GradeBoundariesService.calculateGrade('8700', 75);
      expect(result.grade).toBe(4);
      expect(result.percentage).toBe(47);
    });

    it('should calculate grade 0 for very low marks', () => {
      const result = GradeBoundariesService.calculateGrade('8700', 10);
      expect(result.grade).toBe(0);
      expect(result.percentage).toBe(6);
    });

    it('should handle exact boundary marks', () => {
      const result = GradeBoundariesService.calculateGrade('8700', 121);
      expect(result.grade).toBe(9);
    });

    it('should throw error for invalid subject code', () => {
      expect(() => {
        GradeBoundariesService.calculateGrade('INVALID', 100);
      }).toThrow('Subject boundaries not found for code: INVALID');
    });

    it('should handle foundation tier subjects', () => {
      const result = GradeBoundariesService.calculateGrade('8461F', 140);
      expect(result.grade).toBe(5);
      expect(result.maxMark).toBe(200);
    });

    it('should handle higher tier subjects', () => {
      const result = GradeBoundariesService.calculateGrade('8461H', 120);
      expect(result.grade).toBe(7);
      expect(result.maxMark).toBe(200);
    });
  });

  describe('calculateComponentGrade', () => {
    it('should calculate component grades correctly', () => {
      const result = GradeBoundariesService.calculateComponentGrade(
        '8572/1',
        70
      );
      expect(result.grade).toBe(9);
      expect(result.maxMark).toBe(84);
    });

    it('should throw error for invalid component code', () => {
      expect(() => {
        GradeBoundariesService.calculateComponentGrade('INVALID', 50);
      }).toThrow('Component boundaries not found for code: INVALID');
    });
  });

  describe('getSubjectBoundaries', () => {
    it('should return subject boundaries for valid code', () => {
      const boundaries = GradeBoundariesService.getSubjectBoundaries('8700');
      expect(boundaries).toBeDefined();
      expect(boundaries?.subjectCode).toBe('8700');
      expect(boundaries?.subjectTitle).toBe('ENGLISH LANGUAGE');
    });

    it('should return undefined for invalid code', () => {
      const boundaries = GradeBoundariesService.getSubjectBoundaries('INVALID');
      expect(boundaries).toBeUndefined();
    });
  });

  describe('getComponentBoundaries', () => {
    it('should return component boundaries for valid code', () => {
      const boundaries =
        GradeBoundariesService.getComponentBoundaries('8572/1');
      expect(boundaries).toBeDefined();
      expect(boundaries?.componentCode).toBe('8572/1');
    });

    it('should return undefined for invalid code', () => {
      const boundaries =
        GradeBoundariesService.getComponentBoundaries('INVALID');
      expect(boundaries).toBeUndefined();
    });
  });

  describe('getAllSubjects', () => {
    it('should return all subjects', () => {
      const subjects = GradeBoundariesService.getAllSubjects();
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects[0]).toHaveProperty('subjectCode');
      expect(subjects[0]).toHaveProperty('subjectTitle');
      expect(subjects[0]).toHaveProperty('boundaries');
    });
  });

  describe('getSubjectsByTier', () => {
    it('should return foundation tier subjects', () => {
      const subjects = GradeBoundariesService.getSubjectsByTier('F');
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects.every(s => s.tier === 'F')).toBe(true);
    });

    it('should return higher tier subjects', () => {
      const subjects = GradeBoundariesService.getSubjectsByTier('H');
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects.every(s => s.tier === 'H')).toBe(true);
    });
  });

  describe('searchSubjectsByTitle', () => {
    it('should find subjects by partial title match', () => {
      const subjects = GradeBoundariesService.searchSubjectsByTitle('english');
      expect(subjects.length).toBeGreaterThan(0);
      expect(
        subjects.every(s => s.subjectTitle.toLowerCase().includes('english'))
      ).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const subjects =
        GradeBoundariesService.searchSubjectsByTitle('nonexistent');
      expect(subjects).toEqual([]);
    });
  });

  describe('marksToNextGrade', () => {
    it('should calculate marks needed for next grade', () => {
      const marksNeeded = GradeBoundariesService.marksToNextGrade('8700', 110);
      expect(marksNeeded).toBe(1); // 111 - 110 = 1 (grade 7 to 8)
    });

    it('should return null for highest grade', () => {
      const marksNeeded = GradeBoundariesService.marksToNextGrade('8700', 160);
      expect(marksNeeded).toBeNull();
    });

    it('should return null for invalid subject', () => {
      const marksNeeded = GradeBoundariesService.marksToNextGrade(
        'INVALID',
        100
      );
      expect(marksNeeded).toBeNull();
    });
  });

  describe('getGradeDescription', () => {
    it('should return correct descriptions for all grades', () => {
      expect(GradeBoundariesService.getGradeDescription(9)).toBe(
        'Grade 9 (A*)'
      );
      expect(GradeBoundariesService.getGradeDescription(5)).toBe(
        'Grade 5 (Strong Pass)'
      );
      expect(GradeBoundariesService.getGradeDescription(0)).toBe(
        'Unclassified (U)'
      );
    });
  });

  describe('validateMark', () => {
    it('should validate marks within range', () => {
      expect(GradeBoundariesService.validateMark('8700', 80)).toBe(true);
      expect(GradeBoundariesService.validateMark('8700', 0)).toBe(true);
      expect(GradeBoundariesService.validateMark('8700', 160)).toBe(true);
    });

    it('should invalidate marks outside range', () => {
      expect(GradeBoundariesService.validateMark('8700', -1)).toBe(false);
      expect(GradeBoundariesService.validateMark('8700', 161)).toBe(false);
    });

    it('should return false for invalid subject', () => {
      expect(GradeBoundariesService.validateMark('INVALID', 100)).toBe(false);
    });
  });

  describe('getGradeDistribution', () => {
    it('should return grade distribution for valid subject', () => {
      const distribution = GradeBoundariesService.getGradeDistribution('8700');
      expect(distribution).toBeDefined();
      expect(distribution?.length).toBeGreaterThan(0);
      expect(distribution?.[0]).toHaveProperty('grade');
      expect(distribution?.[0]).toHaveProperty('description');
      expect(distribution?.[0]).toHaveProperty('minMark');
      expect(distribution?.[0]).toHaveProperty('percentage');
    });

    it('should return null for invalid subject', () => {
      const distribution =
        GradeBoundariesService.getGradeDistribution('INVALID');
      expect(distribution).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle zero marks correctly', () => {
      const result = GradeBoundariesService.calculateGrade('8700', 0);
      expect(result.grade).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should handle maximum marks correctly', () => {
      const result = GradeBoundariesService.calculateGrade('8700', 160);
      expect(result.grade).toBe(9);
      expect(result.percentage).toBe(100);
    });

    it('should handle decimal marks by rounding', () => {
      const result = GradeBoundariesService.calculateGrade('8700', 121.5);
      expect(result.grade).toBe(9);
    });
  });
});
