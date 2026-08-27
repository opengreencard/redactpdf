import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions/completions';
import { ApplicationError } from '../errors/applicationError';

/**
 * Providers backed by OpenAI-compatible chat-completions APIs.
 *
 * To add a provider:
 * 1. Add a member here and a `PROVIDER_API_KEY` entry to each `.env.*.example`
 *    file.
 * 2. Add an entry to `providerConfigurations` with
 *    `process.env.PROVIDER_API_KEY` and the provider's OpenAI-compatible
 *    base URL.
 *
 * Production redaction uses `gemini`; other providers are for testing and
 * model comparisons.
 */
export enum OpenAICompatibleProvider {
  deepInfra = 'deepInfra',
  openAI = 'openAI',
  gemini = 'gemini',
}

/** Options for one streaming OpenAI-compatible completion. */
export interface CreateOpenAICompatibleCompletionOptions extends Omit<
  ChatCompletionCreateParamsStreaming,
  'stream' | 'stream_options'
> {
  provider: OpenAICompatibleProvider;
}

/** Token counts reported by an OpenAI-compatible completion. */
export interface OpenAICompatibleCompletionUsage {
  inputTokens: number;
  reasoningTokens: number;
  completionTokens: number;
}

/** Text and usage metadata returned by an OpenAI-compatible completion. */
export interface OpenAICompatibleCompletionResult extends ChatCompletion {
  timing: OpenAICompatibleCompletionTiming;
}

/** Timing metrics for one streaming completion request. */
export interface OpenAICompatibleCompletionTiming {
  msToFirstToken: number | null;
  outputTokensPerSecond: number;
  totalTimeMs: number;
}

/**
 * Stream one completion and return the provider completion with token usage.
 *
 * Callers provide the complete JSON-serializable SDK request options, including
 * any base64 image data. This keeps record/replay keys specific to the full
 * request rather than to an opaque binary argument.
 */
export async function createOpenAICompatibleCompletion({
  provider,
  ...options
}: CreateOpenAICompatibleCompletionOptions): Promise<OpenAICompatibleCompletionResult> {
  const startedAt = Date.now();
  const stream = getOrCreateOpenAIClient(provider).chat.completions.stream({
    ...options,
    stream_options: { include_usage: true },
  });
  let firstTokenAt: number | null = null;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    const contentDelta = delta?.content;
    const refusalDelta = delta?.refusal;
    const reasoningDelta = (
      delta as { reasoning_content?: unknown } | undefined
    )?.reasoning_content;
    if (
      firstTokenAt === null &&
      ((typeof contentDelta === 'string' && contentDelta.length > 0) ||
        (typeof refusalDelta === 'string' && refusalDelta.length > 0) ||
        (typeof reasoningDelta === 'string' && reasoningDelta.length > 0))
    ) {
      firstTokenAt = Date.now();
    }
  }

  const response: ChatCompletion = await stream.finalChatCompletion();
  const totalTimeMs = Date.now() - startedAt;
  const msToFirstToken =
    firstTokenAt === null ? null : firstTokenAt - startedAt;
  const generationTimeMs =
    msToFirstToken === null ? totalTimeMs : totalTimeMs - msToFirstToken;
  return {
    ...response,
    timing: {
      msToFirstToken,
      outputTokensPerSecond:
        generationTimeMs > 0
          ? ((response.usage?.completion_tokens ?? 0) / generationTimeMs) *
            1_000
          : 0,
      totalTimeMs,
    },
  };
}

interface ProviderConfiguration {
  apiKey: string | undefined;
  baseURL: string;
}

const providerConfigurations: Record<
  OpenAICompatibleProvider,
  ProviderConfiguration
> = {
  [OpenAICompatibleProvider.deepInfra]: {
    apiKey: process.env.DEEPINFRA_API_KEY,
    baseURL: 'https://api.deepinfra.com/v1/openai',
  },
  [OpenAICompatibleProvider.openAI]: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
  },
  [OpenAICompatibleProvider.gemini]: {
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
  },
};

const openAIClients = new Map<OpenAICompatibleProvider, OpenAI>();

function getOrCreateOpenAIClient(provider: OpenAICompatibleProvider): OpenAI {
  const existingClient = openAIClients.get(provider);
  if (existingClient) return existingClient;

  const providerConfiguration = providerConfigurations[provider];
  if (!providerConfiguration.apiKey) {
    throw new ApplicationError(
      `API key is not configured for ${providerConfiguration.baseURL}.`
    );
  }

  const client = new OpenAI({
    apiKey: providerConfiguration.apiKey,
    baseURL: providerConfiguration.baseURL,
    timeout: 60_000,
    maxRetries: 2,
  });
  openAIClients.set(provider, client);
  return client;
}
