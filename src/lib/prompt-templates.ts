// Subject-specific prompt templates for accurate GCSE marking

export interface MarkingContext {
  question: string;
  answer: string;
  markScheme?: string;
  totalMarks?: number;
  subject?: string;
  examBoard?: string;
}

export interface PromptTemplate {
  systemPrompt: string;
  buildPrompt: (context: MarkingContext) => string;
  validateResponse: (response: any) => boolean;
}

const MATH_TEMPLATE: PromptTemplate = {
  systemPrompt: `You are a GCSE Mathematics examiner with 10+ years of experience marking at AQA, Edexcel, and OCR standards.

CRITICAL REQUIREMENTS:
- Award marks ONLY for correct mathematical working and final answers
- Follow the exact mark scheme if provided
- Show working marks separately from accuracy marks
- Identify specific mathematical errors (algebraic, arithmetic, conceptual)
- Reference line numbers when pointing out errors
- Give concrete improvement steps, not vague advice`,

  buildPrompt: (context) => {
    const { question, answer, markScheme, totalMarks, examBoard } = context;
    return `## Question (${examBoard || 'GCSE'} Mathematics)
${question}

${markScheme ? `## Official Mark Scheme\n${markScheme}\n` : ''}

## Student Answer
${answer}

## Your Task
Mark this answer following GCSE ${examBoard || ''} standards. Award marks out of ${totalMarks || 'the total available'}.

Provide your response in this EXACT format:
{
  "score": [number out of ${totalMarks || 'total'}],
  "breakdown": [
    {"step": "Step description", "marks_awarded": 1, "marks_available": 2, "comment": "Specific feedback"}
  ],
  "errors": [
    {"line": "Quote the exact error", "type": "algebraic/arithmetic/conceptual", "explanation": "Why this is wrong"}
  ],
  "improvements": [
    "Specific action: Instead of X, do Y because Z"
  ],
  "strengths": ["What the student did well"],
  "grade_boundary_estimate": "A rough grade this would achieve"
}`;
  },

  validateResponse: (response) => {
    return response?.score !== undefined && 
           Array.isArray(response?.errors) && 
           Array.isArray(response?.improvements) &&
           response?.errors?.length > 0;
  }
};

const ENGLISH_TEMPLATE: PromptTemplate = {
  systemPrompt: `You are a GCSE English Language/Literature examiner with expertise in AQA, Edexcel, and OCR marking.

CRITICAL REQUIREMENTS:
- Assess content, structure, language techniques, and technical accuracy separately
- Quote specific examples from the student's work
- Identify missed opportunities for analysis/evaluation
- Give specific vocabulary and sentence structure improvements
- Reference assessment objectives (AO1, AO2, AO3, AO4)`,

  buildPrompt: (context) => {
    const { question, answer, markScheme, totalMarks, examBoard } = context;
    return `## Question (${examBoard || 'GCSE'} English)
${question}

${markScheme ? `## Mark Scheme\n${markScheme}\n` : ''}

## Student Response
${answer}

## Your Task
Mark this response against GCSE English criteria. Award marks out of ${totalMarks || 'the total available'}.

Provide response in this format:
{
  "score": [number],
  "breakdown": [
    {"assessment_objective": "AO1/AO2/AO3/AO4", "marks_awarded": 3, "marks_available": 5, "comment": "Specific feedback"}
  ],
  "errors": [
    {"quote": "exact text", "type": "spelling/grammar/punctuation/expression", "correction": "how to fix"}
  ],
  "improvements": [
    "Use more sophisticated vocabulary like... instead of...",
    "Develop this point by explaining...",
    "Add textual evidence such as..."
  ],
  "strengths": ["Specific examples of good work"],
  "grade_boundary_estimate": "Likely grade range"
}`;
  },

  validateResponse: (response) => {
    return response?.score !== undefined && 
           Array.isArray(response?.breakdown) &&
           Array.isArray(response?.improvements);
  }
};

const SCIENCE_TEMPLATE: PromptTemplate = {
  systemPrompt: `You are a GCSE Science examiner (Biology, Chemistry, Physics) with deep knowledge of practical skills and scientific reasoning.

CRITICAL REQUIREMENTS:
- Award marks for scientific accuracy, method, analysis, and evaluation separately  
- Check calculations step-by-step
- Identify misconceptions vs simple errors
- Assess practical investigation skills if relevant
- Give specific scientific vocabulary improvements`,

  buildPrompt: (context) => {
    const { question, answer, markScheme, totalMarks, subject, examBoard } = context;
    return `## Question (${examBoard || 'GCSE'} ${subject || 'Science'})
${question}

${markScheme ? `## Mark Scheme\n${markScheme}\n` : ''}

## Student Answer
${answer}

## Your Task
Mark this ${subject || 'Science'} response following GCSE standards. Award marks out of ${totalMarks || 'total available'}.

Format:
{
  "score": [number],
  "breakdown": [
    {"skill": "Knowledge/Method/Analysis/Evaluation", "marks_awarded": 2, "marks_available": 3, "comment": "Detailed feedback"}
  ],
  "errors": [
    {"quote": "student text", "type": "misconception/calculation/terminology", "explanation": "Scientific explanation of error"}
  ],
  "improvements": [
    "Use precise terminology: say 'X' instead of 'Y'",
    "Show calculation steps: first find X, then Y",
    "Consider the control variables..."
  ],
  "strengths": ["Scientific understanding demonstrated"],
  "grade_boundary_estimate": "Grade indication"
}`;
  },

  validateResponse: (response) => {
    return response?.score !== undefined && 
           Array.isArray(response?.errors) &&
           response?.errors?.length >= 0;
  }
};

const GENERIC_TEMPLATE: PromptTemplate = {
  systemPrompt: `You are an experienced GCSE examiner across all subjects with 15+ years of marking experience.

REQUIREMENTS:
- Provide detailed, constructive feedback
- Quote specific examples from student work
- Give actionable improvement advice
- Identify both strengths and areas for development`,

  buildPrompt: (context) => {
    const { question, answer, markScheme, totalMarks, subject, examBoard } = context;
    return `## Question (${examBoard || 'GCSE'} ${subject || ''})
${question}

${markScheme ? `## Mark Scheme\n${markScheme}\n` : ''}

## Student Answer  
${answer}

## Your Task
Provide detailed marking and feedback. Award marks out of ${totalMarks || 'total available'}.

Response format:
{
  "score": [number],
  "breakdown": [
    {"criteria": "Description", "marks_awarded": 1, "marks_available": 2, "comment": "Specific feedback"}
  ],
  "errors": [
    {"issue": "What's wrong", "impact": "Why it matters", "fix": "How to improve"}
  ],
  "improvements": ["Specific, actionable advice"],
  "strengths": ["What worked well"],
  "grade_boundary_estimate": "Approximate grade"
}`;
  },

  validateResponse: (response) => {
    return response?.score !== undefined;
  }
};

const TEMPLATES: Record<string, PromptTemplate> = {
  'mathematics': MATH_TEMPLATE,
  'math': MATH_TEMPLATE,
  'maths': MATH_TEMPLATE,
  'english': ENGLISH_TEMPLATE,
  'english language': ENGLISH_TEMPLATE,
  'english literature': ENGLISH_TEMPLATE,
  'biology': SCIENCE_TEMPLATE,
  'chemistry': SCIENCE_TEMPLATE,
  'physics': SCIENCE_TEMPLATE,
  'science': SCIENCE_TEMPLATE,
  'combined science': SCIENCE_TEMPLATE,
};

export function getPromptTemplate(subject?: string): PromptTemplate {
  if (!subject) return GENERIC_TEMPLATE;
  
  const normalizedSubject = subject.toLowerCase().trim();
  return TEMPLATES[normalizedSubject] || GENERIC_TEMPLATE;
}

export function buildMarkingPrompt(context: MarkingContext): { systemPrompt: string; userPrompt: string } {
  const template = getPromptTemplate(context.subject);
  
  return {
    systemPrompt: template.systemPrompt,
    userPrompt: template.buildPrompt(context)
  };
}

export function validateMarkingResponse(response: any, subject?: string): boolean {
  const template = getPromptTemplate(subject);
  return template.validateResponse(response);
}