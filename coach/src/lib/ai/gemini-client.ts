const GEMINI_MODEL = 'gemini-1.0';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateText`;

export interface GeminiGenerationOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
}

export async function generateGeminiText(prompt: string, options?: GeminiGenerationOptions) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const payload = {
    prompt: {
      text: prompt,
    },
    temperature: options?.temperature ?? 0.3,
    maxOutputTokens: options?.maxOutputTokens ?? 512,
    topP: options?.topP ?? 0.95,
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message ?? 'Gemini API request failed';
    throw new Error(`${message} (status ${response.status})`);
  }

  const candidate = data?.candidates?.[0]?.output;

  if (typeof candidate !== 'string') {
    throw new Error('Gemini response does not contain text output');
  }

  return candidate.trim();
}
