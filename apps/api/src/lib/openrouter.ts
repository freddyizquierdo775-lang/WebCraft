import { config } from '../config/env.js';

const BASE_URL = config.OPENROUTER_BASE_URL;

interface OpenRouterCompletionRequest {
  model: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  max_tokens?: number;
  temperature?: number;
}

interface OpenRouterCompletionResponse {
  id: string;
  model: string;
  choices: { message: { content: string }; finish_reason: string }[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function openRouterCompletion(
  req: OpenRouterCompletionRequest,
): Promise<{ content: string; model: string; tokens_in: number; tokens_out: number }> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://webcraft.ai',
      'X-Title': 'WebCraft AI Studio',
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      max_tokens: req.max_tokens ?? 4096,
      temperature: req.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as OpenRouterCompletionResponse;

  return {
    content: data.choices[0]?.message.content ?? '',
    model: data.model,
    tokens_in: data.usage.prompt_tokens,
    tokens_out: data.usage.completion_tokens,
  };
}
