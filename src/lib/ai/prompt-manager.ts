import { db } from '@/lib/db';

export interface PromptVersion {
  id: string;
  versionNumber: string;
  promptContent: string;
  promptType: string;
  isActive: boolean;
  createdAt: Date;
  createdBy?: string;
  metadata: Record<string, any>;
  performanceStats: Record<string, any>;
}

export interface PromptTemplate {
  systemPrompt: string;
  userPrompt: string;
  responseFormat: string;
  constraints: string[];
}

export class PromptManager {
  private static cache: Map<string, PromptVersion> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getActivePrompt(
    promptType: string = 'marking'
  ): Promise<PromptVersion | null> {
    const cacheKey = `active_${promptType}`;
    const now = Date.now();

    // Check cache first
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const dbClient = await db;
      const result = await dbClient.rpc('get_active_prompt', {
        prompt_type_param: promptType,
      });

      if (result.data && result.data.length > 0) {
        const promptData = result.data[0];
        const prompt: PromptVersion = {
          id: promptData.id,
          versionNumber: promptData.version_number,
          promptContent: promptData.prompt_content,
          promptType: promptData.prompt_type,
          isActive: true,
          createdAt: new Date(),
          metadata: promptData.metadata || {},
          performanceStats: {},
        };

        // Cache the result
        this.cache.set(cacheKey, prompt);
        this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

        return prompt;
      }

      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch active prompt:', error);
      return this.getFallbackPrompt(promptType);
    }
  }

  static async createPromptVersion(
    versionNumber: string,
    promptContent: string,
    promptType: string = 'marking',
    metadata: Record<string, any> = {},
    setAsActive: boolean = false
  ): Promise<PromptVersion | null> {
    try {
      // If setting as active, deactivate current active prompt
      if (setAsActive) {
        await this.deactivateCurrentPrompt(promptType);
      }

      const dbClient = await db;
      const { data, error } = await dbClient
        .from('prompt_versions')
        .insert({
          version_number: versionNumber,
          prompt_content: promptContent,
          prompt_type: promptType,
          is_active: setAsActive,
          metadata,
          performance_stats: {},
        })
        .select()
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to create prompt version:', error);
        return null;
      }

      // Clear cache
      this.clearCache(promptType);

      return {
        id: data.id,
        versionNumber: data.version_number,
        promptContent: data.prompt_content,
        promptType: data.prompt_type,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        createdBy: data.created_by,
        metadata: data.metadata || {},
        performanceStats: data.performance_stats || {},
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create prompt version:', error);
      return null;
    }
  }

  static async activatePromptVersion(promptId: string): Promise<boolean> {
    try {
      const dbClient = await db;

      // Get the prompt to activate
      const { data: promptData, error: fetchError } = await dbClient
        .from('prompt_versions')
        .select('prompt_type')
        .eq('id', promptId)
        .single();

      if (fetchError || !promptData) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch prompt for activation:', fetchError);
        return false;
      }

      // Deactivate current active prompt of same type
      await this.deactivateCurrentPrompt(promptData.prompt_type);

      // Activate the new prompt
      const { error: updateError } = await dbClient
        .from('prompt_versions')
        .update({ is_active: true })
        .eq('id', promptId);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error('Failed to activate prompt:', updateError);
        return false;
      }

      // Clear cache
      this.clearCache(promptData.prompt_type);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to activate prompt version:', error);
      return false;
    }
  }

  static async getPromptHistory(
    promptType: string = 'marking',
    limit: number = 10
  ): Promise<PromptVersion[]> {
    try {
      const dbClient = await db;
      const { data, error } = await dbClient
        .from('prompt_versions')
        .select('*')
        .eq('prompt_type', promptType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch prompt history:', error);
        return [];
      }

      return data.map((item: any) => ({
        id: item.id,
        versionNumber: item.version_number,
        promptContent: item.prompt_content,
        promptType: item.prompt_type,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        createdBy: item.created_by,
        metadata: item.metadata || {},
        performanceStats: item.performance_stats || {},
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch prompt history:', error);
      return [];
    }
  }

  static async updatePromptStats(
    promptId: string,
    stats: Record<string, any>
  ): Promise<boolean> {
    try {
      const dbClient = await db;
      const { error } = await dbClient
        .from('prompt_versions')
        .update({
          performance_stats: stats,
        })
        .eq('id', promptId);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to update prompt stats:', error);
        return false;
      }

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update prompt stats:', error);
      return false;
    }
  }

  private static async deactivateCurrentPrompt(
    promptType: string
  ): Promise<void> {
    try {
      const dbClient = await db;
      await dbClient
        .from('prompt_versions')
        .update({ is_active: false })
        .eq('prompt_type', promptType)
        .eq('is_active', true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to deactivate current prompt:', error);
    }
  }

  private static clearCache(promptType: string): void {
    const cacheKey = `active_${promptType}`;
    this.cache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
  }

  private static getFallbackPrompt(promptType: string): PromptVersion {
    return {
      id: 'fallback',
      versionNumber: 'v1.0.0-fallback',
      promptContent: this.getDefaultPromptContent(promptType),
      promptType,
      isActive: true,
      createdAt: new Date(),
      metadata: { source: 'fallback' },
      performanceStats: {},
    };
  }

  private static getDefaultPromptContent(promptType: string): string {
    switch (promptType) {
      case 'marking':
        return `You are an expert GCSE examiner. Analyze the student response and provide detailed, constructive feedback.

Your response must be valid JSON with this exact structure:
{
  "score": <number between 0-100>,
  "grade": "<GCSE grade 1-9 or U>",
  "aosMet": ["<list of assessment objectives met>"],
  "improvementSuggestions": ["<specific improvement suggestions>"],
  "detailedFeedback": "<comprehensive feedback>",
  "confidenceScore": <confidence level 0-1>,
  "reasoning": "<brief explanation of marking rationale>"
}

Guidelines:
- Be constructive and encouraging
- Provide specific, actionable feedback
- Reference GCSE assessment objectives
- Maintain consistency between score and grade
- Include at least 2 improvement suggestions`;
      default:
        return 'Default prompt content for unknown type';
    }
  }

  // Template builder for dynamic prompt construction
  static buildPrompt(
    template: PromptTemplate,
    variables: Record<string, any>
  ): string {
    let prompt = template.systemPrompt + '\n\n' + template.userPrompt;

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return prompt;
  }
}
