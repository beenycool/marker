import { createClient } from '@supabase/supabase-js';
import { MarkingRequest, MarkingResponse } from '@/types';
import { logger } from '@/lib/logger';
import { fallbackProvider } from './fallback-provider';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface GoldenDatasetEntry {
  id: string;
  question: string;
  answer: string;
  markScheme: string;
  marksTotal: number;
  subject: string;
  examBoard: string;
  expectedScore: number;
  expectedGrade: string;
  expectedAosMet: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'tricky';
  quality: 'excellent' | 'good' | 'average' | 'poor';
  tags: string[];
  createdAt: Date;
}

export interface GoldenDatasetResult {
  id: string;
  datasetEntryId: string;
  promptId: string;
  modelUsed: string;
  actualScore: number;
  actualGrade: string;
  actualAosMet: string[];
  improvementSuggestions: string[];
  detailedFeedback: string;
  scoreAccuracy: number;
  gradeAccuracy: number;
  aosAccuracy: number;
  overallQuality: number;
  validationPassed: boolean;
  createdAt: Date;
}

export class GoldenDatasetManager {
  private static readonly DATASET: Omit<GoldenDatasetEntry, 'id' | 'createdAt'>[] = [
    // Excellent responses
    {
      question: "How does Shakespeare present Macbeth's ambition in Act 1 Scene 7?",
      answer: "Shakespeare presents Macbeth's ambition through dramatic soliloquy and imagery. In 'Vaulting ambition, which o'erleaps itself', the metaphor of a rider overreaching creates a sense of dangerous excess. The plosive 'vaulting' conveys energetic, almost violent ambition. Shakespeare uses antithesis in 'I have no spur to prick the sides of my intent, but only vaulting ambition', highlighting how ambition alone drives Macbeth, lacking moral justification. The soliloquy form reveals Macbeth's internal conflict, making his ambition more complex as he weighs 'bloody business' against 'golden opinions'.",
      markScheme: "AO1: Clear understanding of Macbeth's ambition. AO2: Analysis of language and structure. AO3: Understanding of context and themes.",
      marksTotal: 20,
      subject: "English Literature",
      examBoard: "AQA",
      expectedScore: 18,
      expectedGrade: "A*",
      expectedAosMet: ["AO1", "AO2", "AO3"],
      difficulty: "medium",
      quality: "excellent",
      tags: ["macbeth", "ambition", "soliloquy", "shakespeare"]
    },
    {
      question: "Explain how Priestley presents social class in An Inspector Calls.",
      answer: "Priestley presents social class as a destructive force through characterisation and setting. The Birlings' 'substantial' house is described with ostentatious wealth, contrasting with Eva's 'girl of that sort' dismissal. Sheila's transformation from 'pleased with life' to understanding social responsibility shows class consciousness evolving. The Inspector's final speech uses collective pronouns 'we are members of one body' to challenge class divisions. Priestley's cyclical structure with the second phone call suggests unresolved class conflict.",
      markScheme: "AO1: Understanding of social class presentation. AO2: Analysis of language and structure. AO3: Context of 1912/1945.",
      marksTotal: 20,
      subject: "English Literature",
      examBoard: "AQA",
      expectedScore: 17,
      expectedGrade: "A",
      expectedAosMet: ["AO1", "AO2", "AO3"],
      difficulty: "medium",
      quality: "good",
      tags: ["inspector-calls", "social-class", "priestley"]
    },
    // Poor responses
    {
      question: "How does Shakespeare present love in Romeo and Juliet?",
      answer: "Shakespeare presents love as a good thing. Romeo and Juliet love each other very much. They are willing to die for love. The play shows that love is powerful and can overcome family problems. Love makes people do crazy things.",
      markScheme: "AO1: Understanding of love presentation. AO2: Analysis of language and techniques. AO3: Context and themes.",
      marksTotal: 20,
      subject: "English Literature",
      examBoard: "AQA",
      expectedScore: 4,
      expectedGrade: "D",
      expectedAosMet: ["AO1"],
      difficulty: "easy",
      quality: "poor",
      tags: ["romeo-juliet", "love", "basic-analysis"]
    },
    // Tricky questions
    {
      question: "How does the writer use language to present conflict in this extract?",
      answer: "The writer uses violent verbs like 'shattered' and 'exploded' to create immediate physical conflict. The onomatopoeia 'CRACK' in capitals mimics gunfire, making the conflict auditory. Metaphorical language in 'the argument detonated' transforms verbal conflict into something explosive. The short sentence 'Silence.' after the conflict creates dramatic tension through contrast.",
      markScheme: "AO2: Language analysis. AO3: Understanding of conflict theme.",
      marksTotal: 15,
      subject: "English Language",
      examBoard: "AQA",
      expectedScore: 14,
      expectedGrade: "A*",
      expectedAosMet: ["AO2", "AO3"],
      difficulty: "tricky",
      quality: "excellent",
      tags: ["language-analysis", "conflict", "extract"]
    },
    // Science examples
    {
      question: "Explain how the structure of the leaf is adapted for photosynthesis.",
      answer: "The leaf has a thin, flat shape to maximise surface area for light absorption. Palisade cells contain many chloroplasts for efficient light capture. The spongy mesophyll has air spaces for gas exchange. Stomata regulate CO2 entry and O2 exit. Xylem transports water to cells. Phloem transports glucose away. The waxy cuticle prevents water loss while allowing light through.",
      markScheme: "AO1: Knowledge of leaf structure. AO2: Application to photosynthesis.",
      marksTotal: 10,
      subject: "Biology",
      examBoard: "AQA",
      expectedScore: 9,
      expectedGrade: "A*",
      expectedAosMet: ["AO1", "AO2"],
      difficulty: "medium",
      quality: "good",
      tags: ["photosynthesis", "leaf-structure", "adaptation"]
    },
    // History examples
    {
      question: "Why did the League of Nations fail?",
      answer: "The League failed due to structural weaknesses and lack of power. Without the USA, it lacked authority. The absence of an army meant it couldn't enforce decisions. The Great Depression made countries focus on domestic issues. Japan's invasion of Manchuria showed the League's impotence. The Abyssinia crisis revealed Britain and France's self-interest over collective security.",
      markScheme: "AO1: Knowledge of League's failures. AO2: Analysis of reasons. AO3: Judgement on most important factor.",
      marksTotal: 16,
      subject: "History",
      examBoard: "AQA",
      expectedScore: 15,
      expectedGrade: "A",
      expectedAosMet: ["AO1", "AO2", "AO3"],
      difficulty: "medium",
      quality: "good",
      tags: ["league-of-nations", "failure", "inter-war"]
    },
    // Average responses
    {
      question: "Describe the importance of the character of Curley's wife in Of Mice and Men.",
      answer: "Curley's wife is important because she is the only female character. She is lonely and wants attention. The men are afraid of her because she is Curley's wife. She causes problems between the men. Her death is important because it leads to Lennie's death. She represents the theme of loneliness.",
      markScheme: "AO1: Understanding of character. AO2: Analysis of methods. AO3: Themes and context.",
      marksTotal: 20,
      subject: "English Literature",
      examBoard: "AQA",
      expectedScore: 12,
      expectedGrade: "C",
      expectedAosMet: ["AO1", "AO3"],
      difficulty: "medium",
      quality: "average",
      tags: ["mice-men", "curleys-wife", "character-analysis"]
    },
    // Complex analysis
    {
      question: "How does Shelley present the creature as more human than Frankenstein?",
      answer: "Shelley presents the creature as more human through language and development. The creature learns language - 'I learned to distinguish between the operations of my various senses' - showing intellectual growth. His eloquence in 'I ought to be thy Adam' contrasts with Frankenstein's hysterical 'Begone, vile insect!' The creature shows empathy - 'I wept' - while Frankenstein shows none. The creature's narrative frame makes him more sympathetic. Shelley uses pathetic fallacy - 'rain poured down in torrents' - to mirror the creature's emotions, making him more emotionally complex than his creator.",
      markScheme: "AO1: Understanding of character presentation. AO2: Language and structure analysis. AO3: Gothic context and themes.",
      marksTotal: 25,
      subject: "English Literature",
      examBoard: "AQA",
      expectedScore: 23,
      expectedGrade: "A*",
      expectedAosMet: ["AO1", "AO2", "AO3"],
      difficulty: "hard",
      quality: "excellent",
      tags: ["frankenstein", "creature", "humanity", "gothic"]
    },
    // Weak but salvageable
    {
      question: "What are the causes of World War One?",
      answer: "The causes of WW1 were the assassination of Franz Ferdinand, alliances between countries, imperialism, and nationalism. These made countries go to war. The assassination was the spark that started it.",
      markScheme: "AO1: Knowledge of causes. AO2: Analysis of importance. AO3: Links between causes.",
      marksTotal: 12,
      subject: "History",
      examBoard: "AQA",
      expectedScore: 6,
      expectedGrade: "D",
      expectedAosMet: ["AO1"],
      difficulty: "easy",
      quality: "poor",
      tags: ["ww1", "causes", "basic-knowledge"]
    },
    // Chemistry example
    {
      question: "Explain why ionic compounds have high melting points.",
      answer: "Ionic compounds have high melting points because of strong electrostatic forces between oppositely charged ions. These forces require lots of energy to break. The ionic lattice structure means many bonds must be broken. This explains why NaCl has a melting point of 801°C.",
      markScheme: "AO1: Knowledge of ionic bonding. AO2: Explanation of melting point.",
      marksTotal: 8,
      subject: "Chemistry",
      examBoard: "AQA",
      expectedScore: 7,
      expectedGrade: "A",
      expectedAosMet: ["AO1", "AO2"],
      difficulty: "medium",
      quality: "good",
      tags: ["ionic-bonding", "melting-point", "structure"]
    }
  ];

  async populateDataset(): Promise<void> {
    try {
      // Clear existing dataset
      await supabase.from('golden_dataset').delete().neq('id', '');

      // Insert new entries
      for (const entry of GoldenDatasetManager.DATASET) {
        const { data, error } = await supabase
          .from('golden_dataset')
          .insert(entry)
          .select();

        if (error) {
          logger.error('Failed to insert golden dataset entry', { error, entry });
        } else {
          logger.info('Inserted golden dataset entry', { id: data[0].id });
        }
      }

      logger.info('Golden dataset populated successfully');
    } catch (error) {
      logger.error('Failed to populate golden dataset', { error });
      throw error;
    }
  }

  async runPromptAgainstDataset(promptId: string): Promise<GoldenDatasetResult[]> {
    const { data: dataset } = await supabase
      .from('golden_dataset')
      .select('*');

    if (!dataset) {
      throw new Error('No dataset entries found');
    }

    const results: GoldenDatasetResult[] = [];

    for (const entry of dataset) {
      try {
        const request: MarkingRequest = {
          question: entry.question,
          answer: entry.answer,
          markScheme: entry.markScheme,
          marksTotal: entry.marksTotal,
          subject: entry.subject,
          examBoard: entry.examBoard,
        };

        const response = await fallbackProvider.mark(request);

        // Calculate accuracy metrics
        const scoreAccuracy = 1 - Math.abs(response.score - entry.expectedScore) / entry.marksTotal;
        const gradeAccuracy = response.grade === entry.expectedGrade ? 1 : 0;
        const aosAccuracy = this.calculateAosAccuracy(response.aosMet, entry.expectedAosMet);

        const result: Omit<GoldenDatasetResult, 'id' | 'createdAt'> = {
          datasetEntryId: entry.id,
          promptId,
          modelUsed: response.modelUsed,
          actualScore: response.score,
          actualGrade: response.grade,
          actualAosMet: response.aosMet,
          improvementSuggestions: response.improvementSuggestions || [],
          detailedFeedback: response.aiResponse || '',
          scoreAccuracy: Math.max(0, scoreAccuracy),
          gradeAccuracy,
          aosAccuracy,
          overallQuality: (scoreAccuracy + gradeAccuracy + aosAccuracy) / 3,
          validationPassed: true, // Would be enhanced by validator
        };

        const { data } = await supabase
          .from('golden_dataset_results')
          .insert(result)
          .select();

        if (data) {
          results.push(data[0]);
        }
      } catch (error) {
        logger.error('Failed to run prompt against dataset entry', {
          entryId: entry.id,
          promptId,
          error,
        });
      }
    }

    return results;
  }

  private calculateAosAccuracy(actual: string[], expected: string[]): number {
    if (expected.length === 0) return 0;
    
    const intersection = actual.filter(ao => expected.includes(ao));
    return intersection.length / expected.length;
  }

  async getPromptPerformance(promptId: string): Promise<{
    averageScoreAccuracy: number;
    averageGradeAccuracy: number;
    averageAosAccuracy: number;
    overallQuality: number;
    totalTests: number;
  }> {
    const { data: results } = await supabase
      .from('golden_dataset_results')
      .select('*')
      .eq('promptId', promptId);

    if (!results || results.length === 0) {
      return {
        averageScoreAccuracy: 0,
        averageGradeAccuracy: 0,
        averageAosAccuracy: 0,
        overallQuality: 0,
        totalTests: 0,
      };
    }

    const totals = results.reduce(
      (acc: any, result: any) => ({
        scoreAccuracy: acc.scoreAccuracy + result.scoreAccuracy,
        gradeAccuracy: acc.gradeAccuracy + result.gradeAccuracy,
        aosAccuracy: acc.aosAccuracy + result.aosAccuracy,
        overallQuality: acc.overallQuality + result.overallQuality,
      }),
      { scoreAccuracy: 0, gradeAccuracy: 0, aosAccuracy: 0, overallQuality: 0 }
    );

    return {
      averageScoreAccuracy: totals.scoreAccuracy / results.length,
      averageGradeAccuracy: totals.gradeAccuracy / results.length,
      averageAosAccuracy: totals.aosAccuracy / results.length,
      overallQuality: totals.overallQuality / results.length,
      totalTests: results.length,
    };
  }

  async generateReport(): Promise<{
    dataset: GoldenDatasetEntry[];
    results: GoldenDatasetResult[];
    summary: {
      totalEntries: number;
      testedPrompts: string[];
      averageOverallQuality: number;
    };
  }> {
    const [dataset, results] = await Promise.all([
      supabase.from('golden_dataset').select('*'),
      supabase.from('golden_dataset_results').select('*'),
    ]);

    const uniquePrompts = [...new Set(results.data?.map((r: any) => r.promptId) || [])] as string[];

    const overallQuality = results.data?.reduce((sum: number, r: any) => sum + r.overallQuality, 0) || 0;
    const averageOverallQuality = results.data?.length ? overallQuality / results.data.length : 0;

    return {
      dataset: dataset.data || [],
      results: results.data || [],
      summary: {
        totalEntries: dataset.data?.length || 0,
        testedPrompts: uniquePrompts,
        averageOverallQuality,
      },
    };
  }
}

export const goldenDatasetManager = new GoldenDatasetManager();