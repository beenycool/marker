import { db } from './db';
import { logger } from './logger';

const samplePastPapers = [
  {
    title: 'AQA GCSE English Literature Paper 1',
    subject: 'English Literature',
    examBoard: 'AQA',
    year: 2023,
    questions: [
      {
        id: '1',
        question:
          'Starting with this speech (Act 1, Scene 3), explore how Shakespeare presents the relationship between Macbeth and Lady Macbeth.',
        marks: 30,
        topic: 'Character Analysis',
        markScheme:
          'Students should analyse the power dynamics, manipulation, and ambition shown in their relationship. Look for specific quotes and language analysis.',
      },
      {
        id: '2',
        question:
          'How does Dickens present the character of Scrooge at the beginning of A Christmas Carol?',
        marks: 30,
        topic: 'Character Analysis',
        markScheme:
          "Students should identify key quotations showing Scrooge's miserly nature and analyze Dickens' language techniques.",
      },
      {
        id: '3',
        question: 'Explore the theme of social class in An Inspector Calls.',
        marks: 30,
        topic: 'Theme Analysis',
        markScheme:
          'Students should discuss how Priestley presents different social classes and their treatment of Eva Smith.',
      },
      {
        id: '4',
        question: 'How does Stevenson create tension in Dr Jekyll and Mr Hyde?',
        marks: 30,
        topic: 'Literary Techniques',
        markScheme:
          'Students should analyze narrative structure, foreshadowing, and Victorian Gothic elements.',
      },
    ],
  },
  {
    title: 'Edexcel GCSE Mathematics Paper 2',
    subject: 'Mathematics',
    examBoard: 'Edexcel',
    year: 2023,
    questions: [
      {
        id: '1',
        question: 'Work out 2.7 × 0.4',
        marks: 1,
        topic: 'Number',
        markScheme: '1.08',
      },
      {
        id: '2',
        question: 'Solve 3x + 7 = 22',
        marks: 2,
        topic: 'Algebra',
        markScheme:
          'x = 5 (2 marks for correct answer, 1 mark for correct working)',
      },
      {
        id: '3',
        question: 'Find the area of a triangle with base 12cm and height 8cm',
        marks: 2,
        topic: 'Geometry',
        markScheme: 'Area = ½ × base × height = ½ × 12 × 8 = 48 cm²',
      },
      {
        id: '4',
        question:
          'The probability of rain tomorrow is 0.3. What is the probability it will NOT rain?',
        marks: 2,
        topic: 'Probability',
        markScheme: '1 - 0.3 = 0.7',
      },
    ],
  },
  {
    title: 'OCR GCSE Biology Paper 1',
    subject: 'Biology',
    examBoard: 'OCR',
    year: 2023,
    questions: [
      {
        id: '1',
        question: 'Name the process by which plants make their own food.',
        marks: 1,
        topic: 'Plant Biology',
        markScheme: 'Photosynthesis',
      },
      {
        id: '2',
        question:
          'Explain how the structure of a red blood cell is adapted to its function.',
        marks: 4,
        topic: 'Cell Biology',
        markScheme:
          'Biconcave shape increases surface area; no nucleus provides more space for haemoglobin; small and flexible to pass through capillaries; contains haemoglobin to carry oxygen.',
      },
      {
        id: '3',
        question: 'Describe the process of mitosis.',
        marks: 6,
        topic: 'Cell Division',
        markScheme:
          'DNA replication; chromosomes condense; nuclear membrane breaks down; spindle fibers form; chromosomes align at equator; sister chromatids separate; two identical nuclei form.',
      },
    ],
  },
  {
    title: 'AQA GCSE History Paper 1',
    subject: 'History',
    examBoard: 'AQA',
    year: 2023,
    questions: [
      {
        id: '1',
        question: 'Describe two features of medieval hospitals.',
        marks: 4,
        topic: 'Medicine Through Time',
        markScheme:
          'Two features such as: run by monks/nuns; provided food and shelter; prayer was important; few medical treatments; cared for poor and pilgrims.',
      },
      {
        id: '2',
        question:
          'Explain why there was little change in medical knowledge during the medieval period.',
        marks: 12,
        topic: 'Medicine Through Time',
        markScheme:
          'Influence of Church; limited education; belief in Four Humours; lack of technology; emphasis on prayer over treatment.',
      },
    ],
  },
  {
    title: 'WJEC GCSE Geography Paper 1',
    subject: 'Geography',
    examBoard: 'WJEC',
    year: 2023,
    questions: [
      {
        id: '1',
        question: 'Define the term "urbanisation".',
        marks: 2,
        topic: 'Urban Geography',
        markScheme:
          "The process by which an increasing percentage of a country's population lives in urban areas/towns and cities.",
      },
      {
        id: '2',
        question:
          'Explain two reasons why people migrate from rural to urban areas.',
        marks: 4,
        topic: 'Migration',
        markScheme:
          'Push factors: lack of employment, poor services, limited opportunities. Pull factors: better jobs, education, healthcare, entertainment.',
      },
    ],
  },
  {
    title: 'Edexcel GCSE Chemistry Paper 2',
    subject: 'Chemistry',
    examBoard: 'Edexcel',
    year: 2023,
    questions: [
      {
        id: '1',
        question: 'What is the chemical symbol for sodium?',
        marks: 1,
        topic: 'Atomic Structure',
        markScheme: 'Na',
      },
      {
        id: '2',
        question: 'Balance the equation: Na + Cl₂ → NaCl',
        marks: 2,
        topic: 'Chemical Reactions',
        markScheme: '2Na + Cl₂ → 2NaCl',
      },
      {
        id: '3',
        question: 'Explain why noble gases are unreactive.',
        marks: 3,
        topic: 'Periodic Table',
        markScheme:
          'Noble gases have full outer electron shells; stable electron configuration; no tendency to gain or lose electrons.',
      },
    ],
  },
];

export async function seedPastPapers() {
  logger.info('Starting past papers seeding process');

  try {
    // Check if any past papers already exist
    const dbClient = await db;
    const { count, error } = await dbClient
      .from('past_papers')
      .select('*', { count: 'exact', head: true });

    if (error) {
      logger.error('Error checking existing past papers', error);
      return;
    }

    if (count && count > 0) {
      logger.info(`${count} past papers already exist. Skipping seed.`);
      return;
    }

    // Create past papers
    const results = await Promise.allSettled(
      samplePastPapers.map(async paper => {
        const { error } = await dbClient.from('past_papers').insert({
          title: paper.title,
          subject: paper.subject,
          exam_board: paper.examBoard,
          year: paper.year,
          questions: paper.questions,
        });

        if (error) {
          logger.error(`Failed to seed paper: ${paper.title}`, error);
          throw error;
        }

        logger.info(`Successfully seeded paper: ${paper.title}`);
        return paper.title;
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info(
      `Seeding completed: ${successful} successful, ${failed} failed`
    );

    if (failed > 0) {
      logger.warn(`${failed} papers failed to seed. Check logs for details.`);
    }
  } catch (error) {
    logger.error('Unexpected error during seeding', error);
  }
}
