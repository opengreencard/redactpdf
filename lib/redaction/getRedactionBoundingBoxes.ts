import { z } from 'zod';
import {
  createOpenAICompatibleCompletion,
  type CreateOpenAICompatibleCompletionOptions,
  type OpenAICompatibleCompletionTiming,
  type OpenAICompatibleCompletionUsage,
  OpenAICompatibleProvider,
} from '../ai/createOpenAICompatibleCompletion';
import {
  type AutoRedactionBoundingBox,
  RedactedDataType,
  redactedDataTypeSchema,
  redactedDataTypeToDescription,
} from '../models/redactionTypes';
import { isNotNullOrUndefined } from '../typescript/isNotNullOrUndefined';

const redactionCoordinateSchema = z.number().finite().int().min(0).max(1000);

const redactionBoxObjectSchema = z.object({
  dataType: redactedDataTypeSchema,
  text: z.string(),
  minX: redactionCoordinateSchema,
  minY: redactionCoordinateSchema,
  maxX: redactionCoordinateSchema,
  maxY: redactionCoordinateSchema,
});

const redactionBoxObjectResponseSchema = z.object({
  boxes: redactionBoxObjectSchema.array(),
});

const redactionObjectResponseJSONSchema =
  makeRedactionObjectResponseJSONSchema();

/** Redaction boxes and token usage returned for one page. */
export interface GetRedactionBoundingBoxesResult {
  boxes: Omit<AutoRedactionBoundingBox, 'page'>[];
  usage: OpenAICompatibleCompletionUsage;
  timing: OpenAICompatibleCompletionTiming;
}

const redactionModel = {
  provider: OpenAICompatibleProvider.gemini,
  model: 'gemini-3.5-flash-lite',
  reasoning_effort: 'medium',
} satisfies Pick<
  CreateOpenAICompatibleCompletionOptions,
  'provider' | 'model' | 'reasoning_effort'
>;

/**
 * Detect identifying or sensitive content in one page image.
 *
 * Coordinates are requested as integers from 0 through 1000 so the model
 * does not need to reason about the source image's pixel dimensions. The
 * returned result includes normalized boxes and provider token usage.
 */
export async function getRedactionBoundingBoxes(
  image: Uint8Array
): Promise<GetRedactionBoundingBoxesResult> {
  const startedAt = Date.now();
  const imageDataURL = `data:image/jpeg;base64,${Buffer.from(image).toString(
    'base64'
  )}`;
  const response = await createOpenAICompatibleCompletion(
    buildRedactionCompletionOptions(imageDataURL)
  );
  console.info(
    `${redactionModel.provider} vision request completed in ${
      Date.now() - startedAt
    }ms.`
  );
  const content = response.choices[0]?.message.content;
  const parsedBoxes = parseRedactionBoxes(content);
  return {
    boxes: parsedBoxes
      .map(mapRedactionBoxToBoundingBox)
      .filter(isNotNullOrUndefined),
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      reasoningTokens:
        response.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
    },
    timing: response.timing,
  };
}

function buildRedactionCompletionOptions(
  imageDataURL: string
): CreateOpenAICompatibleCompletionOptions {
  const userMessage: CreateOpenAICompatibleCompletionOptions['messages'][number] =
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: redactionObjectPrompt,
        },
        { type: 'image_url', image_url: { url: imageDataURL } },
      ],
    };

  return {
    ...redactionModel,
    messages: [userMessage],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'redaction_boxes',
        strict: true,
        schema: redactionObjectResponseJSONSchema,
      },
    },
  };
}

function parseRedactionBoxes(
  content: string | null | undefined
): z.infer<typeof redactionBoxObjectSchema>[] {
  const parsedJSON = JSON.parse(stripMarkdownCodeFence(content ?? ''));
  return redactionBoxObjectResponseSchema.parse(parsedJSON).boxes;
}

function makeRedactionObjectResponseJSONSchema(): Record<string, unknown> {
  const schema: Record<string, unknown> = z.toJSONSchema(
    redactionBoxObjectResponseSchema
  );
  delete schema.$schema;
  return schema;
}

const redactionObjectPrompt = makeRedactionObjectPrompt();

function makeRedactionObjectPrompt(): string {
  const dataTypeLines = Object.values(RedactedDataType)
    .map(
      (dataType): string =>
        `- ${dataType}: ${redactedDataTypeToDescription[dataType]}`
    )
    .join('\n');

  return `Find every item in this page that could identify or embarrass
someone and should be redacted. Err toward over-redacting.

Classify each box with exactly one of these dataType values:
${dataTypeLines}

Return only this JSON shape:
{"boxes":[{"dataType":"personName","text":"visible text or description","minX":0,"minY":0,"maxX":0,"maxY":0}]}
Coordinates are integers from 0 to 1000 normalized to this image, origin
top-left, Y down, and ordered minX, minY, maxX, maxY.
For \`text\`, return only the sensitive value or a short description of the
redacted content. Do not include a field label or surrounding instructions.
For example, return \`03005988\`, not \`Passport card number 03005988\`.`;
}

function mapRedactionBoxToBoundingBox(
  rawBox: z.infer<typeof redactionBoxObjectSchema>
): Omit<AutoRedactionBoundingBox, 'page'> | null {
  const {
    dataType,
    text,
    minX: rawMinX,
    minY: rawMinY,
    maxX: rawMaxX,
    maxY: rawMaxY,
  } = rawBox;
  const [minX, maxX] = normalizeRange(rawMinX, rawMaxX);
  const [minY, maxY] = normalizeRange(rawMinY, rawMaxY);
  if (minX === maxX || minY === maxY) return null;

  const boundingBox: Omit<AutoRedactionBoundingBox, 'page'> = {
    type: 'automatic',
    dataType,
    text,
    box: {
      minX: minX / 1000,
      minY: minY / 1000,
      maxX: maxX / 1000,
      maxY: maxY / 1000,
    },
    enabled: true,
  };
  return boundingBox;
}

function normalizeRange(start: number, end: number): [number, number] {
  return start <= end ? [start, end] : [end, start];
}

function stripMarkdownCodeFence(response: string): string {
  return response
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}
