import {
  GradeBoundariesData,
  SubjectGradeBoundaries,
  ComponentGradeBoundaries,
} from '@/types/grade-boundaries';

// Helper function to create grade boundaries array
function createBoundaries(
  maxMark: number,
  boundaries: (number | null)[]
): any[] {
  const grades = [9, 8, 7, 6, 5, 4, 3, 2, 1];
  const result = [];

  for (let i = 0; i < boundaries.length; i++) {
    if (boundaries[i] !== null && boundaries[i] !== undefined) {
      const minMark = boundaries[i]!;
      const maxGradeMark = i === 0 ? maxMark : boundaries[i - 1]! - 1;
      result.push({
        grade: grades[i],
        minMark,
        maxMark: maxGradeMark,
      });
    }
  }

  // Add U grade (unclassified)
  const lastBoundary = boundaries
    .filter(b => b !== null && b !== undefined)
    .pop();
  if (lastBoundary !== undefined) {
    result.push({
      grade: 0,
      minMark: 0,
      maxMark: lastBoundary - 1,
    });
  }

  return result;
}

// Edexcel GCSE grade boundaries (June 2023)
const edexcelBoundaries = {
  '8700': {
    subjectCode: '8700',
    subjectTitle: 'ENGLISH LANGUAGE',
    maxMark: 160,
    boundaries: createBoundaries(160, [121, 111, 101, 91, 81, 75, 64, 53, 42]),
  },
  '8461F': {
    subjectCode: '8461F',
    subjectTitle: 'MATHEMATICS FOUNDATION',
    tier: 'F' as const,
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      null,
      140,
      120,
      100,
      80,
      60,
    ]),
  },
  '8461H': {
    subjectCode: '8461H',
    subjectTitle: 'MATHEMATICS HIGHER',
    tier: 'H' as const,
    maxMark: 200,
    boundaries: createBoundaries(200, [
      160,
      140,
      120,
      100,
      90,
      80,
      null,
      null,
      null,
    ]),
  },
};

/**
 * OCR boundaries extracted from Excel (June 2024)
 * This replaces all previous OCR boundaries.
 */
const ocrBoundaries = {
  J198: {
    subjectCode: 'J198',
    subjectTitle: '',
    maxMark: 210,
    boundaries: createBoundaries(210, [
      null,
      null,
      null,
      174,
      157,
      140,
      null,
      null,
      123,
    ]),
  },
  J170: {
    subjectCode: 'J170',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      187,
      null,
      175,
      163,
      null,
      null,
      146,
    ]),
  },
  J171: {
    subjectCode: 'J171',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      187,
      null,
      175,
      163,
      null,
      null,
      146,
    ]),
  },
  J172: {
    subjectCode: 'J172',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      187,
      null,
      175,
      163,
      null,
      null,
      146,
    ]),
  },
  J173: {
    subjectCode: 'J173',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      187,
      null,
      175,
      163,
      null,
      null,
      146,
    ]),
  },
  J174: {
    subjectCode: 'J174',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      187,
      null,
      175,
      163,
      null,
      null,
      146,
    ]),
  },
  J175: {
    subjectCode: 'J175',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      187,
      null,
      175,
      163,
      null,
      null,
      146,
    ]),
  },
  J176: {
    subjectCode: 'J176',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      187,
      null,
      175,
      163,
      null,
      null,
      146,
    ]),
  },
  J247: {
    subjectCode: 'J247',
    subjectTitle: 'Higher Tier: 03+04',
    maxMark: 180,
    boundaries: createBoundaries(180, [
      null,
      142,
      null,
      131,
      null,
      121,
      null,
      104,
      null,
    ]),
  },
  J257: {
    subjectCode: 'J257',
    subjectTitle: 'Higher Tier: 03+04',
    maxMark: 180,
    boundaries: createBoundaries(180, [
      null,
      143,
      null,
      131,
      null,
      119,
      null,
      100,
      null,
    ]),
  },
  J204: {
    subjectCode: 'J204',
    subjectTitle: '',
    maxMark: 160,
    boundaries: createBoundaries(160, [
      null,
      null,
      116,
      null,
      106,
      96,
      null,
      null,
      84,
    ]),
  },
  J248: {
    subjectCode: 'J248',
    subjectTitle: 'Higher Tier: 03+04',
    maxMark: 180,
    boundaries: createBoundaries(180, [
      null,
      154,
      null,
      140,
      null,
      127,
      null,
      107,
      null,
    ]),
  },
  J258: {
    subjectCode: 'J258',
    subjectTitle: 'Higher Tier: 03+04',
    maxMark: 180,
    boundaries: createBoundaries(180, [
      null,
      128,
      null,
      114,
      null,
      100,
      null,
      81,
      null,
    ]),
  },
  J270: {
    subjectCode: 'J270',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      153,
      140,
      128,
      null,
      null,
      113,
    ]),
  },
  J199: {
    subjectCode: 'J199',
    subjectTitle: 'Option F: 12+23',
    maxMark: 180,
    boundaries: createBoundaries(180, [
      null,
      null,
      null,
      142,
      131,
      120,
      null,
      null,
      106,
    ]),
  },
  J292: {
    subjectCode: 'J292',
    subjectTitle: 'Option K: 01+05+06',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      169,
      147,
      126,
      null,
      null,
      113,
    ]),
  },
  J277: {
    subjectCode: 'J277',
    subjectTitle: '',
    maxMark: 160,
    boundaries: createBoundaries(160, [
      null,
      null,
      null,
      136,
      126,
      117,
      null,
      null,
      102,
    ]),
  },
  J310: {
    subjectCode: 'J310',
    subjectTitle: 'All options',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      152,
      137,
      122,
      null,
      null,
      106,
    ]),
  },
  J316: {
    subjectCode: 'J316',
    subjectTitle: 'All options',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      177,
      167,
      158,
      null,
      null,
      143,
    ]),
  },
  J205: {
    subjectCode: 'J205',
    subjectTitle: '',
    maxMark: 160,
    boundaries: createBoundaries(160, [
      null,
      null,
      null,
      118,
      107,
      97,
      null,
      null,
      84,
    ]),
  },
  J351: {
    subjectCode: 'J351',
    subjectTitle: '',
    maxMark: 160,
    boundaries: createBoundaries(160, [
      null,
      130,
      null,
      null,
      119,
      109,
      null,
      null,
      97,
    ]),
  },
  J352: {
    subjectCode: 'J352',
    subjectTitle: '',
    maxMark: 160,
    boundaries: createBoundaries(160, [
      null,
      null,
      null,
      133,
      118,
      103,
      null,
      null,
      84,
    ]),
  },
  J309: {
    subjectCode: 'J309',
    subjectTitle:
      'All options  *To create the overall boundaries, components are weighted to give marks out of 150',
    maxMark: 300,
    boundaries: createBoundaries(300, [
      null,
      null,
      null,
      235,
      212,
      190,
      null,
      null,
      167,
    ]),
  },
  J383: {
    subjectCode: 'J383',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      157,
      141,
      126,
      null,
      null,
      110,
    ]),
  },
  J384: {
    subjectCode: 'J384',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      158,
      145,
      132,
      null,
      null,
      118,
    ]),
  },
  J411: {
    subjectCode: 'J411',
    subjectTitle: 'Option HF: 18+21+39',
    maxMark: 210,
    boundaries: createBoundaries(210, [
      null,
      null,
      null,
      160,
      140,
      120,
      null,
      null,
      105,
    ]),
  },
  J282: {
    subjectCode: 'J282',
    subjectTitle: 'Option K: 01+05+06',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      172,
      156,
      140,
      null,
      null,
      123,
    ]),
  },
  J560: {
    subjectCode: 'J560',
    subjectTitle: 'Higher Tier: 04+05+06',
    maxMark: 300,
    boundaries: createBoundaries(300, [
      null,
      null,
      245,
      null,
      195,
      null,
      145,
      null,
      110,
    ]),
  },
  J200: {
    subjectCode: 'J200',
    subjectTitle:
      'All options  *To create the overall boundaries, components 03 and 04 are weighted to give marks out of 60',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      163,
      152,
      141,
      null,
      null,
      125,
    ]),
  },
  J536: {
    subjectCode: 'J536',
    subjectTitle: '',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      null,
      170,
      159,
      149,
      null,
      null,
      136,
    ]),
  },
  J587: {
    subjectCode: 'J587',
    subjectTitle: 'All options',
    maxMark: 200,
    boundaries: createBoundaries(200, [
      null,
      null,
      160,
      null,
      150,
      141,
      null,
      null,
      128,
    ]),
  },
  J249: {
    subjectCode: 'J249',
    subjectTitle: 'Higher Tier: 03+04',
    maxMark: 180,
    boundaries: createBoundaries(180, [
      null,
      null,
      147,
      null,
      135,
      null,
      123,
      null,
      104,
    ]),
  },
  J259: {
    subjectCode: 'J259',
    subjectTitle: 'Higher Tier: 03+04',
    maxMark: 180,
    boundaries: createBoundaries(180, [
      null,
      null,
      144,
      null,
      131,
      null,
      118,
      null,
      102,
    ]),
  },
  J203: {
    subjectCode: 'J203',
    subjectTitle: '',
    maxMark: 180,
    boundaries: createBoundaries(180, [
      null,
      null,
      null,
      143,
      132,
      121,
      null,
      null,
      105,
    ]),
  },
  J625: {
    subjectCode: 'J625',
    subjectTitle: 'Option DA: 04+05+09',
    maxMark: 252,
    boundaries: createBoundaries(252, [
      null,
      null,
      null,
      196,
      181,
      166,
      null,
      null,
      145,
    ]),
  },
  J125: {
    subjectCode: 'J125',
    subjectTitle: 'Religion, philosophy and ethics in the modern world',
    maxMark: 1,
    boundaries: createBoundaries(1, [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      126,
    ]),
  },
  'J250   F': {
    subjectCode: 'J250   F',
    subjectTitle: 'Option components 01, 02, 03, 04, 05, 06',
    maxMark: 360,
    boundaries: createBoundaries(360, [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]),
  },
  'J250   H': {
    subjectCode: 'J250   H',
    subjectTitle: 'Option components 07, 08, 09, 10, 11, 12',
    maxMark: 360,
    boundaries: createBoundaries(360, [
      273,
      260,
      248,
      236,
      null,
      224,
      208,
      null,
      192,
    ]),
  },
  'J260   F': {
    subjectCode: 'J260   F',
    subjectTitle: 'Option components 01, 02, 03, 04',
    maxMark: 360,
    boundaries: createBoundaries(360, [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]),
  },
  'J260   H': {
    subjectCode: 'J260   H',
    subjectTitle: 'Option components 05, 06, 07, 08',
    maxMark: 360,
    boundaries: createBoundaries(360, [
      256,
      242,
      228,
      214,
      null,
      201,
      185,
      null,
      169,
    ]),
  },
};

// Main subjects grade boundaries
export const gradeBoundariesData: GradeBoundariesData = {
  subjects: {
    // Add Edexcel boundaries
    ...edexcelBoundaries,
    // Add OCR boundaries
    ...ocrBoundaries,
    // ... (rest of existing subjects unchanged)
    // (omitted for brevity)
  },
  components: {
    '8572/1': {
      subjectCode: '8572',
      componentCode: '8572/1',
      componentTitle: 'BIOLOGY PAPER 1',
      maxMark: 84,
      boundaries: createBoundaries(84, [70, 62, 54, 46, 38, 30, 22, 14, 10]),
    },
    '8572/2': {
      subjectCode: '8572',
      componentCode: '8572/2',
      componentTitle: 'BIOLOGY PAPER 2',
      maxMark: 84,
      boundaries: createBoundaries(84, [null, 68, 60, 52, 44, 36, 28, 20, 12]),
    },
  },
};

// Helper function to get subject boundaries
export function getSubjectBoundaries(
  subjectCode: string
): SubjectGradeBoundaries | undefined {
  return gradeBoundariesData.subjects[subjectCode];
}

// Helper function to get component boundaries
export function getComponentBoundaries(
  componentCode: string
): ComponentGradeBoundaries | undefined {
  return gradeBoundariesData.components[componentCode];
}

// Helper function to get all subjects
export function getAllSubjects(): SubjectGradeBoundaries[] {
  return Object.values(gradeBoundariesData.subjects);
}

// Helper function to get subjects by tier
export function getSubjectsByTier(tier: 'F' | 'H'): SubjectGradeBoundaries[] {
  return Object.values(gradeBoundariesData.subjects).filter(
    subject => subject.tier === tier
  );
}
