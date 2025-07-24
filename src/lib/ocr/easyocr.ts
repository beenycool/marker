export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  metadata?: {
    language?: string;
    detectedRegions?: number;
  };
}

export class EasyOCRProcessor {
  private apiEndpoint: string;
  private apiKey?: string;

  constructor(apiEndpoint?: string, apiKey?: string) {
    this.apiEndpoint =
      apiEndpoint ||
      process.env.EASYOCR_API_ENDPOINT ||
      'http://localhost:8080';
    this.apiKey = apiKey || process.env.EASYOCR_API_KEY;
  }

  async processImage(
    imageBuffer: Buffer,
    mimeType: string,
    languages: string[] = ['en']
  ): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      const formData = new FormData();

      // Convert buffer to blob
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });
      formData.append('image', blob);
      formData.append('languages', JSON.stringify(languages));

      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.apiEndpoint}/ocr`, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `OCR service returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        text: data.text || '',
        confidence: data.confidence || 0,
        processingTime,
        metadata: {
          language: data.language,
          detectedRegions: data.regions?.length || 0,
        },
      };
    } catch (error) {
      throw new Error(
        `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/health`, {
        method: 'GET',
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
