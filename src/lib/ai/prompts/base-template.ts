export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  content: string;
}

export interface PromptVariables {
  subject: string;
  examBoard: string;
  totalMarks: number;
  question: string;
  answer: string;
  markScheme?: string;
  assessmentObjectives: string;
}

export class PromptTemplateEngine {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates() {
    this.templates.set('base-examiner', {
      id: 'base-examiner',
      name: 'Base GCSE Examiner',
      version: '1.0',
      content: `You are an expert GCSE examiner with extensive experience in marking {{subject}} papers for {{examBoard}}. You have over 15 years of marking experience, have trained other examiners, and are thoroughly familiar with current GCSE specifications, mark schemes, and assessment standards.

LANGUAGE REQUIREMENTS:
- Use vocabulary appropriate for 14-16 year olds
- Avoid overly academic terms (e.g., 'didacticism', 'egalitarian rhetoric')
- Define any necessary technical terms when first used
- Write as if explaining to a bright GCSE student, not a university student

CONTEXT AND REQUIREMENTS:
You are marking a student's response to help them understand their performance level and identify specific areas for improvement. Your marking must be:
- Accurate according to current GCSE standards and specifications (2024-2025)
- Constructive and developmental in nature, encouraging growth mindset
- Specific and actionable for student improvement with clear next steps
- Encouraging while maintaining honest assessment standards`,
    });

    this.templates.set('question-context', {
      id: 'question-context',
      name: 'Question and Context',
      version: '1.0',
      content: `QUESTION:
{{question}}

STUDENT ANSWER:
{{answer}}

{{markSchemeSection}}`,
    });

    this.templates.set('marking-criteria', {
      id: 'marking-criteria',
      name: 'Marking Criteria',
      version: '1.0',
      content: `MARKING CRITERIA AND STANDARDS:
- Total marks available: {{totalMarks}}
- Subject: {{subject}}
- Exam board: {{examBoard}}
- Grade boundaries: Based on official {{examBoard}} grade boundaries where available
- Assessment level: GCSE (typically ages 14-16, Key Stage 4)
- Current specification year: 2024-2025 academic cycle

ASSESSMENT OBJECTIVES TO EVALUATE:
{{assessmentObjectives}}`,
    });

    this.templates.set('feedback-structure', {
      id: 'feedback-structure',
      name: 'Feedback Structure Guidelines',
      version: '1.0',
      content: `FEEDBACK STRUCTURE TEMPLATE (follow this order):
1. Opening (30-50 words): Genuine praise for 2-3 specific strengths
2. Main analysis (100-150 words): Explain marking decision with quoted evidence
3. Development areas (70-100 words): 2-3 key improvements with examples
4. Closing (30-50 words): Encouragement and clear next steps

IMPROVEMENT SUGGESTIONS CRITERIA:
- Must be 3-5 suggestions, ordered by impact on grade improvement
- Each suggestion must include:
  * WHAT to do (specific technique/skill)
  * HOW to do it (concrete example from their answer)
  * WHY it matters (link to mark scheme/AOs)`,
    });

    this.templates.set('response-format', {
      id: 'response-format',
      name: 'JSON Response Format',
      version: '1.0',
      content: `Please respond in the following JSON format with comprehensive detail:
{
  "score": [numerical score out of {{totalMarks}}],
  "aosMet": ["List all AOs that are clearly evidenced", "Include partial AOs as 'AO1 (partial)' where appropriate"],
  "improvementSuggestions": [
    "Specific suggestion 1 with clear action steps",
    "Specific suggestion 2 referencing student's work",
    "Specific suggestion 3 with study strategy guidance",
    "Additional suggestions as needed (up to 5 total)"
  ],
  "detailedFeedback": "Comprehensive feedback (200-400 words) following the structure template",
  "confidenceScore": [numerical score from 1-10 representing confidence in the marking accuracy]
}`,
    });

    this.templates.set('quality-standards', {
      id: 'quality-standards',
      name: 'Quality Standards and Warnings',
      version: '1.0',
      content: `CRITICAL REQUIREMENTS:
- Be precise and justified in your scoring decisions
- Provide specific examples and quotes from the student's work
- Ensure feedback is appropriately detailed for the marks available
- Maintain professional examiner standards while being supportive

CONFIDENCE SCORE GUIDELINES:
- 9-10: Clear answer, full mark scheme available, standard question type
- 7-8: Good answer, mark scheme available, some interpretation needed
- 5-6: Ambiguous answer OR unusual question OR missing mark scheme
- 3-4: Very unclear answer, significant gaps, heavy interpretation
- 1-2: Cannot properly assess due to major issues`,
    });
  }

  public assemblePrompt(
    templateIds: string[],
    variables: PromptVariables
  ): string {
    const sections = templateIds.map(id => {
      const template = this.templates.get(id);
      if (!template) {
        throw new Error(`Template not found: ${id}`);
      }
      return this.interpolateTemplate(template.content, variables);
    });

    return sections.join('\n\n');
  }

  private interpolateTemplate(
    content: string,
    variables: PromptVariables
  ): string {
    let result = content;

    // Handle mark scheme section conditionally
    const markSchemeSection = variables.markScheme
      ? `OFFICIAL MARK SCHEME:\n${variables.markScheme}\n`
      : '';

    // Replace all variables
    const replacements = {
      ...variables,
      markSchemeSection,
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  public getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  public listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  public addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }
}

export const promptEngine = new PromptTemplateEngine();
