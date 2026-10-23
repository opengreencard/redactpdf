import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions/completions';
import { ApplicationError } from '../errors/applicationError';

/**
 * Providers backed by OpenAI-compatible chat-completions APIs.
 *
 * You don't need keys for every provider:
 * - `gemini`: required for production redaction. The cluster Secret only
 *   injects `GEMINI_API_KEY`.
 * - `deepInfra`: optional. Local or production-env model comparisons.
 * - `openAI`: optional. Local or production-env model comparisons.
 * Keep the optional keys in local `.env.*` files, not in the Kubernetes
 * Secret.
 *
 * To add a provider:
 * 1. Add a member here and a `PROVIDER_API_KEY` entry to each `.env.*.example`
 *    file.
 * 2. Add an entry to `providerConfigurations` with
 *    `process.env.PROVIDER_API_KEY` and the provider's OpenAI-compatible
 *    base URL.
 */
export enum OpenAICompatibleProvider {
  gemini = 'gemini',
  deepInfra = 'deepInfra',
  openAI = 'openAI',
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
  cost: OpenAICompatibleCompletionCost;
  timing: OpenAICompatibleCompletionTiming;
}

/** Timing metrics for one streaming completion request. */
export interface OpenAICompatibleCompletionTiming {
  msToFirstToken: number | null;
  outputTokensPerSecond: number;
  totalTimeMs: number;
}

/** Estimated USD cost of one completion, from list prices. */
export interface OpenAICompatibleCompletionCost {
  inputUSD: number;
  outputUSD: number;
  totalUSD: number;
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
  // Check the price before the paid request, so an unpriced model fails fast.
  const pricing = modelPricingByName[options.model];
  if (!pricing) {
    throw new ApplicationError(`No pricing configured for ${options.model}.`);
  }

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
  const { usage } = response;
  if (!usage) {
    throw new ApplicationError(`No token usage returned for ${options.model}.`);
  }
  // completion_tokens leaves out thinking tokens, but total_tokens includes
  // them. Google bills thinking at the output rate, so bill everything after
  // the prompt.
  const inputUSD =
    (usage.prompt_tokens * pricing.inputUSDPerMillionTokens) / 1_000_000;
  const outputTokens = usage.total_tokens - usage.prompt_tokens;
  const outputUSD =
    (outputTokens * pricing.outputUSDPerMillionTokens) / 1_000_000;
  return {
    ...response,
    cost: {
      inputUSD,
      outputUSD,
      totalUSD: inputUSD + outputUSD,
    },
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

/** USD per 1M tokens for one model. */
interface ModelPricing {
  inputUSDPerMillionTokens: number;
  outputUSDPerMillionTokens: number;
}

/**
 * Standard paid-tier list prices from
 * https://ai.google.dev/gemini-api/docs/pricing, checked 2026-10-23.
 *
 * Prices step up later, so update these when they do:
 * - Gemini 4 Argon: Dec 1, 2026 ($4 input, $20 output)
 * - Gemini 3.8 Flash: Jan 1, 2027 ($1.50 input, $7.50 output)
 */
const modelPricingByName: Record<string, ModelPricing> = {
  'gemini-4-argon': {
    inputUSDPerMillionTokens: 2,
    outputUSDPerMillionTokens: 10,
  },
  'gemini-3.8-flash': {
    inputUSDPerMillionTokens: 0.75,
    outputUSDPerMillionTokens: 3.75,
  },
};

interface ProviderConfiguration {
  apiKey: string | undefined;
  baseURL: string;
}

const providerConfigurations: Record<
  OpenAICompatibleProvider,
  ProviderConfiguration
> = {
  [OpenAICompatibleProvider.gemini]: {
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
  },
  [OpenAICompatibleProvider.deepInfra]: {
    apiKey: process.env.DEEPINFRA_API_KEY,
    baseURL: 'https://api.deepinfra.com/v1/openai',
  },
  [OpenAICompatibleProvider.openAI]: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
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
