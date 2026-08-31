import {
  AutoRedactionBoundingBox,
  BoundingBox,
  GenericGetRedactionResponse,
  ManualRedactionBoundingBox,
  PageSize,
  RedactedDataType,
  RedactedGetRedactionResponse,
  RedactionStatus,
} from '../models/redactionTypes';
import type { OpenAICompatibleCompletionResult } from '../ai/createOpenAICompatibleCompletion';

/** Browser-safe fixture builders for redaction types used in tests and stories. */
// Keep the builder collection inferred so its public keys stay synchronized
// with the builders defined in this module.
// eslint-disable-next-line no-restricted-syntax
const ClientFakeData = {
  makeBoundingBox,
  makePageSize,
  makeAutoRedactionBoundingBox,
  makeManualRedactionBoundingBox,
  makeGenericGetRedactionResponse,
  makeRedactedGetRedactionResponse,
  makeOpenAICompatibleCompletionResult,
};

export default ClientFakeData;

function makeBoundingBox(options: Partial<BoundingBox> = {}): BoundingBox {
  // Random defaults so independently built boxes tend to be distinct.
  const x = randomNormalizedRange();
  const y = randomNormalizedRange();
  return {
    minX: options.minX ?? x.min,
    minY: options.minY ?? y.min,
    maxX: options.maxX ?? x.max,
    maxY: options.maxY ?? y.max,
  };
}

function randomNormalizedRange(): { min: number; max: number } {
  const a = Math.random();
  const b = Math.random();
  return a < b ? { min: a, max: b } : { min: b, max: a };
}

function makePageSize(options: Partial<PageSize> = {}): PageSize {
  return {
    width: options.width ?? 1275,
    height: options.height ?? 1650,
  };
}

function makeAutoRedactionBoundingBox(
  options: Partial<Omit<AutoRedactionBoundingBox, 'type'>> = {}
): AutoRedactionBoundingBox {
  return {
    type: 'automatic',
    dataType: options.dataType ?? RedactedDataType.personName,
    text: options.text ?? 'Jane Doe',
    box: options.box ?? makeBoundingBox(),
    page: options.page ?? 1,
    enabled: options.enabled ?? true,
  };
}

function makeManualRedactionBoundingBox(
  options: Partial<Omit<ManualRedactionBoundingBox, 'type'>> = {}
): ManualRedactionBoundingBox {
  return {
    type: 'manual',
    box: options.box ?? makeBoundingBox(),
    page: options.page ?? 1,
    enabled: options.enabled ?? true,
  };
}

function makeGenericGetRedactionResponse(
  options: Partial<GenericGetRedactionResponse> = {}
): GenericGetRedactionResponse {
  const response: GenericGetRedactionResponse = {
    status: options.status ?? RedactionStatus.redacting,
    pageCount: options.pageCount ?? 1,
    createdAt: options.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
  return response;
}

function makeRedactedGetRedactionResponse(
  options: Partial<Omit<RedactedGetRedactionResponse, 'status'>> = {}
): RedactedGetRedactionResponse {
  const pageCount = options.pageCount ?? options.pageSizes?.length ?? 1;
  const response: RedactedGetRedactionResponse = {
    status: RedactionStatus.redacted,
    pageCount,
    pageSizes:
      options.pageSizes ??
      Array.from({ length: pageCount }, () => makePageSize()),
    redactionBoundingBoxes: options.redactionBoundingBoxes ?? [
      makeAutoRedactionBoundingBox(),
    ],
    createdAt: options.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
  return response;
}

/** Create a minimal valid provider response for mocked vision error tests. */
function makeOpenAICompatibleCompletionResult(
  options: Partial<OpenAICompatibleCompletionResult> = {}
): OpenAICompatibleCompletionResult {
  const response: OpenAICompatibleCompletionResult = {
    object: options.object ?? 'chat.completion',
    id: options.id ?? 'process-redaction-test',
    created: options.created ?? 0,
    model: options.model ?? 'test-model',
    choices: options.choices ?? [
      {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            boxes: [
              {
                dataType: RedactedDataType.personName,
                text: 'Jane Doe',
                minX: 100,
                minY: 200,
                maxX: 300,
                maxY: 400,
              },
            ],
          }),
          refusal: null,
        },
        finish_reason: 'stop',
        index: 0,
        logprobs: null,
      },
    ],
    timing: options.timing ?? {
      msToFirstToken: 1,
      outputTokensPerSecond: 1,
      totalTimeMs: 1,
    },
  };
  return response;
}
