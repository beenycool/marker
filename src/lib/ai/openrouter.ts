import { BaseAIProvider } from './providers';
import { MarkingRequest, MarkingResponse } from '@/types';
import { getEnvVar } from '../cloudflare-env';

export class OpenRouterProvider extends BaseAIProvider {
  name = 'OpenRouter';
  model = 'Multi-Model Router';
  tier: 'free' | 'pro' = 'free';
  available = true;

  private readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  // Provider order: DeepSeek Chat > Qwen > Gemini 2.0 Flash > Gemini Flash 1.5
  private readonly PROVIDER_ORDER = [
    'deepseek/deepseek-chat-v3-0324:free',
    'qwen/qwen3-235b-a22b-07-25:free',
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-flash-1.5:free',
  ];

  async mark(request: MarkingRequest): Promise<MarkingResponse> {
    const prompt = this.buildPrompt(request);

    let lastError: Error | null = null;

    for (const model of this.PROVIDER_ORDER) {
      try {
        const response = await this.makeRequest(prompt, model);
        return this.parseResponse(response, model);
      } catch (error) {
        lastError = error as Error;
        continue;
      }
    }

    throw lastError || new Error('All OpenRouter models failed');
  }

  private async makeRequest(prompt: string, model: string): Promise<any> {
    const apiKey = await getEnvVar('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aimarker.tech',
        'X-Title': 'AIMARKER - GCSE AI Marking',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  protected parseResponse(content: string, modelUsed: string): MarkingResponse {
    if (!content) {
      throw new Error('Empty response from AI model');
    }

    return super.parseResponse(content, modelUsed);
  }
}
