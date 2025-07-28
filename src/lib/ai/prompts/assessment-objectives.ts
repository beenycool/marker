export interface AssessmentObjectives {
  [subject: string]: string;
}

export const ASSESSMENT_OBJECTIVES: AssessmentObjectives = {
  'English Literature':
    'AO1: Shows you understand the text and can use quotes\nAO2: Shows you can analyse language, structure and form\nAO3: Shows you understand context (when it was written/set)\nAO4: Shows you can write clearly with good vocabulary',
  'English Language':
    "AO1: Shows you can find and understand information in texts\nAO2: Shows you can explain how writers use language and structure\nAO3: Shows you can compare different writers' ideas\nAO4: Shows you can judge how effective texts are\nAO5: Shows you can write clearly and effectively\nAO6: Shows you can use vocabulary and sentences accurately",
  Mathematics:
    'AO1: Shows you can use mathematical techniques correctly\nAO2: Shows you can explain your reasoning and communicate mathematically\nAO3: Shows you can solve problems in different contexts',
  Biology:
    'AO1: Shows you understand biological knowledge\nAO2: Shows you can apply your knowledge to new situations\nAO3: Shows you can analyse information and draw conclusions',
  Chemistry:
    'AO1: Shows you understand chemical knowledge\nAO2: Shows you can apply your knowledge to new situations\nAO3: Shows you can analyse information and draw conclusions',
  Physics:
    'AO1: Shows you understand physics knowledge\nAO2: Shows you can apply your knowledge to new situations\nAO3: Shows you can analyse information and draw conclusions',
  History:
    'AO1: Shows you understand historical knowledge\nAO2: Shows you can explain and analyse historical events\nAO3: Shows you can analyse and evaluate sources\nAO4: Shows you can analyse different interpretations',
  Geography:
    'AO1: Shows you understand geographical knowledge\nAO2: Shows you can apply your knowledge to real situations\nAO3: Shows you can use geographical skills and techniques\nAO4: Shows you can investigate geographical questions',
};

export function getAssessmentObjectives(subject: string): string {
  return (
    ASSESSMENT_OBJECTIVES[subject] ||
    'AO1: Shows you understand the knowledge\nAO2: Shows you can apply knowledge to new situations\nAO3: Shows you can analyse and evaluate information'
  );
}
