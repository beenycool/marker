#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const goldenDataset = [
  // High-quality Macbeth response
  {
    question: "How does Shakespeare present Macbeth's ambition in Act 1 Scene 7?",
    answer: "Shakespeare presents Macbeth's ambition as a destructive force through the metaphor 'vaulting ambition, which o'erleaps itself'. The verb 'vaulting' creates a sense of dangerous excess, while the horse-riding metaphor suggests Macbeth will 'fall on the other side' of his aspirations. This is reinforced by the semantic field of darkness in 'stars, hide your fires', where Shakespeare associates concealment with evil intent. The soliloquy form allows direct access to Macbeth's tortured psychology, showing how ambition corrupts moral judgment.",
    markScheme: "AO1: Clear understanding of Macbeth's ambition. AO2: Analysis of language and structure. AO3: Context of Jacobean beliefs about ambition and regicide.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 8",
    qualityLevel: "excellent"
  },
  
  // Medium-quality response
  {
    question: "How does Shakespeare present the theme of guilt in Macbeth?",
    answer: "Shakespeare presents guilt through Macbeth's hallucinations. He sees a dagger which shows he feels guilty about killing Duncan. Lady Macbeth also feels guilty and sleepwalks. The blood on their hands represents their guilt. This shows that doing bad things makes you feel guilty.",
    markScheme: "AO1: Understanding of guilt theme. AO2: Analysis of imagery and symbolism. AO3: Links to Jacobean beliefs about conscience.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 5",
    qualityLevel: "average"
  },
  
  // Low-quality response
  {
    question: "How does Shakespeare present Lady Macbeth?",
    answer: "Lady Macbeth is a bad person who tells Macbeth to kill the king. She is mean and bossy. She goes mad at the end because she feels bad about what she did. Shakespeare makes her seem evil.",
    markScheme: "AO1: Understanding of character. AO2: Analysis of language and presentation. AO3: Context of gender roles in Jacobean society.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 3",
    qualityLevel: "poor"
  },
  
  // High-quality An Inspector Calls
  {
    question: "How does Priestley present the theme of social responsibility in An Inspector Calls?",
    answer: "Priestley presents social responsibility as a moral imperative through the Inspector's didactic function. The Inspector's final speech 'we are members of one body' employs collective pronouns to emphasize social interconnectedness. This is reinforced through the dramatic irony of Birling's Titanic prediction, which Priestley uses to mock capitalist hubris. The play's circular structure, with the repeated doorbell at the end, suggests the cyclical nature of social injustice until responsibility is accepted. Priestley's 1945 context, post-WWII, shapes the play's socialist message as a warning against capitalist individualism.",
    markScheme: "AO1: Understanding of social responsibility theme. AO2: Analysis of dramatic techniques and structure. AO3: Context of 1912 setting vs 1945 writing.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 9",
    qualityLevel: "excellent"
  },
  
  // High-quality Jekyll & Hyde
  {
    question: "How does Stevenson present duality in The Strange Case of Dr Jekyll and Mr Hyde?",
    answer: "Stevenson presents duality through the gothic doubling of Jekyll and Hyde, where the respectable Victorian gentleman conceals his degenerate alter ego. The motif of doors symbolizes this duality - Jekyll's 'handsome' house contrasts with Hyde's 'blistered and distained' door. Stevenson's use of pathetic fallacy in the 'foggy' London streets mirrors the moral ambiguity of Victorian society. The epistolary structure, through multiple narrators, creates narrative unreliability that reflects the fragmented Victorian psyche. This duality critiques Victorian repression, where outward respectability masks inner corruption.",
    markScheme: "AO1: Understanding of duality theme. AO2: Analysis of gothic conventions and symbolism. AO3: Context of Victorian society and scientific developments.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 8",
    qualityLevel: "excellent"
  },
  
  // Medium-quality Poetry
  {
    question: "Compare how poets present power in 'Ozymandias' and one other poem.",
    answer: "In Ozymandias, Shelley shows power doesn't last through the broken statue. The 'trunkless legs' show how the king's power has been destroyed by time. In My Last Duchess, the Duke has power over his wife and has her killed. Both poems show that power can be bad. Shelley uses the desert setting to show how nature is more powerful than humans.",
    markScheme: "AO1: Understanding of power theme. AO2: Comparative analysis of language and structure. AO3: Context of Romanticism and Renaissance Italy.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 5",
    qualityLevel: "average"
  },
  
  // High-quality Unseen Poetry
  {
    question: "How does the poet present the experience of war in 'Bayonet Charge'?",
    answer: "Hughes presents war as a dehumanizing experience through the soldier's transformation into 'a hand' that 'grew hot'. This synecdoche reduces the soldier to a single body part, emphasizing how war strips away humanity. The enjambment in 'the patriotic tear that had brimmed in his eye / Sweating like molten iron' creates a sense of panic and disorientation. Hughes' use of present tense throughout creates immediacy, while the semantic field of heat - 'hot', 'molten', 'flame' - suggests the burning intensity of battle. The final image of 'the green hedge' represents the natural world that war violates.",
    markScheme: "AO1: Understanding of war experience. AO2: Analysis of language, structure and form. AO3: Context of Hughes' own military experience.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 8",
    qualityLevel: "excellent"
  },
  
  // Tricky question - good answer
  {
    question: "How does Shakespeare present the relationship between Macbeth and Lady Macbeth as changing?",
    answer: "Shakespeare presents a dramatic power shift through the motif of masculinity. Initially, Lady Macbeth 'unsex me here' challenges gender norms to dominate Macbeth, using imperatives 'look like the innocent flower'. However, post-murder, Macbeth's 'be innocent of the knowledge' reverses their dynamic - he now commands her. The sleepwalking scene shows Lady Macbeth's psychological deterioration, her fragmented language 'out, damned spot' contrasting with her earlier controlled rhetoric. This reversal culminates in Macbeth's nihilistic 'Out, out, brief candle' soliloquy, where he faces mortality alone, having outgrown his wife's influence.",
    markScheme: "AO1: Understanding of changing relationship. AO2: Analysis of language and dramatic techniques. AO3: Context of Jacobean gender roles.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 9",
    qualityLevel: "excellent"
  },
  
  // Weak response to tricky question
  {
    question: "How does Shakespeare present the relationship between Macbeth and Lady Macbeth as changing?",
    answer: "At the start Lady Macbeth is in charge and tells Macbeth what to do. Then later Macbeth starts making decisions without her. They grow apart because of the murder. Lady Macbeth feels guilty and goes mad.",
    markScheme: "AO1: Understanding of changing relationship. AO2: Analysis of language and dramatic techniques. AO3: Context of Jacobean gender roles.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 4",
    qualityLevel: "poor"
  },
  
  // High-quality contextual response
  {
    question: "How does Priestley use the Inspector as a dramatic device?",
    answer: "Priestley employs the Inspector as a structural device and moral mouthpiece, functioning as a 'ghoul' who haunts the Birling family. His name 'Goole' suggests supernatural qualities, while his omniscient knowledge creates dramatic tension. The Inspector's interrogation technique mirrors a morality play, with each character's confession serving as a moral lesson. His final speech functions as a socialist sermon, directly addressing the audience with 'we are responsible for each other'. Priestley's cyclical structure, with the Inspector's return implied at the end, transforms him from character to eternal moral conscience.",
    markScheme: "AO1: Understanding of Inspector's role. AO2: Analysis of dramatic techniques. AO3: Context of morality plays and socialist message.",
    marksTotal: 8,
    subject: "English Literature",
    level: "GCSE",
    examBoard: "AQA",
    expectedGrade: "Grade 9",
    qualityLevel: "excellent"
  }
];

async function populateDataset() {
  console.log('🎯 Populating golden dataset with 10 diverse examples...');
  
  for (const entry of goldenDataset) {
    const { data, error } = await supabase
      .from('golden_dataset')
      .insert({
        question: entry.question,
        answer: entry.answer,
        mark_scheme: entry.markScheme,
        marks_total: entry.marksTotal,
        subject: entry.subject,
        level: entry.level,
        exam_board: entry.examBoard,
        expected_grade: entry.expectedGrade,
        quality_level: entry.qualityLevel,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Error inserting entry:', error);
    } else {
      console.log(`✅ Added ${entry.qualityLevel} example for ${entry.subject}`);
    }
  }
  
  console.log('🎉 Golden dataset populated successfully!');
}

populateDataset().catch(console.error);