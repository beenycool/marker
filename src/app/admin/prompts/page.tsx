'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Play, Save } from 'lucide-react';
import { goldenDatasetManager } from '@/lib/ai/golden-dataset-enhanced';

interface Prompt {
  id: string;
  name: string;
  template: string;
  isActive: boolean;
  createdAt: string;
  performance?: {
    averageScoreAccuracy: number;
    averageGradeAccuracy: number;
    overallQuality: number;
    totalTests: number;
  };
}

export default function PromptManagementPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [editingTemplate, setEditingTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/prompts');
      const data = await response.json();
      setPrompts(data.prompts);
    } catch (err) {
      setError('Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const testPrompt = async (promptId: string) => {
    try {
      setIsTesting(true);
      await goldenDatasetManager.runPromptAgainstDataset(promptId);
      await loadPrompts();
    } catch (err) {
      setError('Failed to test prompt');
    } finally {
      setIsTesting(false);
    }
  };

  const setActivePrompt = async (promptId: string) => {
    try {
      await fetch('/api/admin/prompts/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId }),
      });
      await loadPrompts();
    } catch (err) {
      setError('Failed to set active prompt');
    }
  };

  const savePrompt = async () => {
    if (!selectedPrompt) return;
    
    try {
      await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPrompt.id,
          template: editingTemplate,
        }),
      });
      await loadPrompts();
    } catch (err) {
      setError('Failed to save prompt');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prompt Management</h1>
        <p className="text-muted-foreground">
          Manage and test AI marking prompts against the golden dataset
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Prompts</CardTitle>
              <CardDescription>Select a prompt to edit and test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPrompt?.id === prompt.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      setSelectedPrompt(prompt);
                      setEditingTemplate(prompt.template);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{prompt.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {prompt.performance?.totalTests || 0} tests
                        </p>
                      </div>
                      {prompt.isActive && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    {prompt.performance && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground">
                          Quality: {(prompt.performance.overallQuality * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedPrompt ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedPrompt.name}</CardTitle>
                <CardDescription>Edit and test this prompt</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={editingTemplate}
                    onChange={(e) => setEditingTemplate(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                  
                  <div className="flex gap-2">
                    <Button onClick={savePrompt} disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    
                    <Button
                      onClick={() => testPrompt(selectedPrompt.id)}
                      disabled={isTesting}
                      variant="secondary"
                    >
                      {isTesting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Test Against Dataset
                    </Button>
                    
                    {!selectedPrompt.isActive && (
                      <Button
                        onClick={() => setActivePrompt(selectedPrompt.id)}
                        variant="outline"
                      >
                        Set as Active
                      </Button>
                    )}
                  </div>

                  {selectedPrompt.performance && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Performance</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-2xl">
                              {(selectedPrompt.performance.averageScoreAccuracy * 100).toFixed(0)}%
                            </CardTitle>
                            <CardDescription>Score Accuracy</CardDescription>
                          </CardHeader>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-2xl">
                              {(selectedPrompt.performance.averageGradeAccuracy * 100).toFixed(0)}%
                            </CardTitle>
                            <CardDescription>Grade Accuracy</CardDescription>
                          </CardHeader>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-2xl">
                              {(selectedPrompt.performance.overallQuality * 100).toFixed(0)}%
                            </CardTitle>
                            <CardDescription>Overall Quality</CardDescription>
                          </CardHeader>
                        </Card>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-2">
                        Based on {selectedPrompt.performance.totalTests} test cases
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Select a prompt to begin</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
