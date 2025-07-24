import { BaseAIProvider } from './providers';
import { MarkingRequest, MarkingResponse } from '@/types';
import { getEnvVar } from '../cloudflare-env';

class OpenRouterClient {
  private readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(private apiKey: string) {}

  async generate(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens: number;
    temperature: number;
  }): Promise<any> {
    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aimarker.tech',
        'X-Title': 'AIMARKER - GCSE AI Marking',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }
}

export class QwenProProvider extends BaseAIProvider {
  name = 'Qwen Pro';
  model = 'qwen/qwen3-235b-a22b-07-25:free';
  tier = 'pro' as const;
  available = true;

  private client: OpenRouterClient | null = null;

  async getClient() {
    if (!this.client) {
      const apiKey = await getEnvVar('OPENROUTER_API_KEY');
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is required');
      }
      this.client = new OpenRouterClient(apiKey);
    }
    return this.client;
  }

  async mark(request: MarkingRequest): Promise<MarkingResponse> {
    try {
      const client = await this.getClient();
      const prompt = this.buildPrompt(request);

      const response = await client.generate({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const text = response.choices[0]?.message?.content || '';
      
      if (!text) {
        throw new Error('Empty response from AI model');
      }

      return this.parseResponse(text, this.model);
    } catch (error) {
      throw new Error('Failed to process marking request with Qwen Pro');
    }
  }
}
