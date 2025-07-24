'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Calculator,
  Beaker,
  Globe,
  Languages,
  Microscope,
  Palette,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SubjectSelectorProps {
  subjects: string[];
  paperCounts: Record<string, number>;
  onSelectSubject: (subject: string) => void;
}

const subjectIcons: Record<string, React.ComponentType<any>> = {
  Mathematics: Calculator,
  English: BookOpen,
  Science: Beaker,
  Biology: Microscope,
  Chemistry: Beaker,
  Physics: Globe,
  History: BookOpen,
  Geography: Globe,
  Art: Palette,
  French: Languages,
  Spanish: Languages,
  German: Languages,
  Sociology: Users,
  Psychology: Users,
  Economics: Calculator,
  Business: Calculator,
  'Computer Science': Calculator,
  'Design Technology': Palette,
  Music: Palette,
  Drama: Palette,
  'Physical Education': Users,
  'Religious Studies': BookOpen,
  'Media Studies': Palette,
  'Film Studies': Palette,
  'Food Technology': Beaker,
  Textiles: Palette,
  Politics: Users,
  Philosophy: BookOpen,
  Literature: BookOpen,
  Citizenship: Users,
  Statistics: Calculator,
  'Further Mathematics': Calculator,
  'Applied Science': Beaker,
  Engineering: Calculator,
  'Health & Social Care': Users,
  'Travel & Tourism': Globe,
  ICT: Calculator,
  Dance: Palette,
  Photography: Palette,
  'Graphic Design': Palette,
  'Product Design': Palette,
  'Environmental Science': Beaker,
  Geology: Globe,
  Astronomy: Globe,
  'Classical Civilisation': BookOpen,
  Latin: Languages,
  Greek: Languages,
  Arabic: Languages,
  Chinese: Languages,
  Japanese: Languages,
  Italian: Languages,
  Russian: Languages,
  Portuguese: Languages,
  Turkish: Languages,
  Urdu: Languages,
  Bengali: Languages,
  Gujarati: Languages,
  Hindi: Languages,
  Punjabi: Languages,
  Polish: Languages,
  'Modern Hebrew': Languages,
  Persian: Languages,
  Dutch: Languages,
  'Modern Greek': Languages,
  Welsh: Languages,
  Irish: Languages,
  'Scottish Gaelic': Languages,
};

const getSubjectColor = (subject: string) => {
  const colors = [
    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'bg-green-500/20 text-green-300 border-green-500/30',
    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'bg-red-500/20 text-red-300 border-red-500/30',
    'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    'bg-teal-500/20 text-teal-300 border-teal-500/30',
  ];

  // Generate consistent color based on subject name
  const hash = subject
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function SubjectSelector({
  subjects,
  paperCounts,
  onSelectSubject,
}: SubjectSelectorProps) {
  const sortedSubjects = [...subjects].sort((a, b) => {
    // Sort by paper count (descending) then alphabetically
    const countDiff = (paperCounts[b] || 0) - (paperCounts[a] || 0);
    return countDiff !== 0 ? countDiff : a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Your Subject
        </h2>
        <p className="text-gray-300">
          Select a subject to view available past papers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedSubjects.map((subject, index) => {
          const Icon = subjectIcons[subject] || BookOpen;
          const paperCount = paperCounts[subject] || 0;

          return (
            <motion.div
              key={subject}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer h-full group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge className={getSubjectColor(subject)}>
                      {paperCount} {paperCount === 1 ? 'paper' : 'papers'}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg leading-tight">
                    {subject}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    onClick={() => onSelectSubject(subject)}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 group-hover:border-white/30 transition-colors"
                  >
                    Select Subject
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {sortedSubjects.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Subjects Available
          </h3>
          <p className="text-gray-400">
            Past papers will appear here once they're added to the system.
          </p>
        </div>
      )}
    </div>
  );
}
