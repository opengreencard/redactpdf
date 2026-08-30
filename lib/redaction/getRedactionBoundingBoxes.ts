import { z } from 'zod';
import {
  createOpenAICompatibleCompletion,
  type OpenAICompatibleCompletionResult,
  OpenAICompatibleProvider,
} from '../ai/createOpenAICompatibleCompletion';
import {
  type SinglePageRedactionBoundingBox,
  RedactedDataType,
  redactedDataTypeSchema,
  redactedDataTypeToDescription,
} from '../models/redactionTypes';

/** Redaction boxes and token usage returned for one page. */
export interface GetRedactionBoundingBoxesResult {
  boxes: SinglePageRedactionBoundingBox[];
  response: OpenAICompatibleCompletionResult;
}

/**
 * Detect identifying or sensitive content in one page image.
 *
 * Coordinates are integers from 0 through 1000 in the model response, then
 * converted to the normalized coordinates used by the app.
 *
 * Gemini 3.7 Flash is intentionally used here because local comparisons show
 * it is more exhaustive at finding sensitive content, including repeated or
 * faint values, than the previous Flash Lite model.
 */
export async function getRedactionBoundingBoxes(
  image: Uint8Array
): Promise<GetRedactionBoundingBoxesResult> {
  const response = await requestRedactionVision(
    makeImageDataURL(image),
    redactionPrompt,
    redactionResponseJSONSchema
  );
  const { boxes } = parseRedactionResponse(
    response.choices[0]?.message.content
  );

  return {
    boxes: boxes.map(mapRedactionBoxToBoundingBox),
    response,
  };
}

interface RedactionBoxContent {
  dataType: RedactedDataType;
  text: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface RedactionResponse {
  boxes: RedactionBoxContent[];
}

const redactionCoordinateSchema = z.number().finite().int().min(0).max(1000);

const redactionBoxSchema: z.ZodType<RedactionBoxContent> = z
  .object({
    dataType: redactedDataTypeSchema,
    text: z.string(),
    minX: redactionCoordinateSchema,
    minY: redactionCoordinateSchema,
    maxX: redactionCoordinateSchema,
    maxY: redactionCoordinateSchema,
  })
  .refine(
    ({ minX, minY, maxX, maxY }) => minX < maxX && minY < maxY,
    'Redaction box coordinates must have positive width and height.'
  );

const redactionResponseSchema: z.ZodType<RedactionResponse> = z.object({
  boxes: redactionBoxSchema.array(),
});

function requestRedactionVision(
  imageDataURL: string,
  prompt: string,
  responseSchema: Record<string, unknown>
): ReturnType<typeof createOpenAICompatibleCompletion> {
  return createOpenAICompatibleCompletion({
    provider: OpenAICompatibleProvider.gemini,
    model: 'gemini-3.7-flash',
    reasoning_effort: 'medium',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataURL } },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'redaction_boxes',
        strict: true,
        schema: responseSchema,
      },
    },
  });
}

function parseRedactionResponse(
  content: string | null | undefined
): RedactionResponse {
  return redactionResponseSchema.parse(JSON.parse(content ?? ''));
}

function makeRedactionResponseJSONSchema(): Record<string, unknown> {
  const schema: Record<string, unknown> = z.toJSONSchema(
    redactionResponseSchema
  );
  delete schema.$schema;
  return schema;
}

const redactionResponseJSONSchema = makeRedactionResponseJSONSchema();

function makeImageDataURL(image: Uint8Array): string {
  return `data:image/jpeg;base64,${Buffer.from(image).toString('base64')}`;
}

function makeRedactionPrompt(): string {
  const dataTypeLines = Object.values(RedactedDataType)
    .map(
      (dataType): string =>
        `- ${dataType}: ${redactedDataTypeToDescription[dataType]}`
    )
    .join('\n');

  return `Find every item in this page that could identify or embarrass
someone and should be redacted. Err toward over-redacting.

Be aggressive about content that is faded, low-contrast, blurred, partially
obscured, or degraded by scanning. A faded text fragment or photo-like scan
artifact may still contain identifying information and should be redacted when
it could be a person, identifier, or other sensitive content.

Classify each box with exactly one of these dataType values:
${dataTypeLines}

Return only this JSON shape:
{"boxes":[{"dataType":"personName","text":"visible text or description","minX":0,"minY":0,"maxX":0,"maxY":0}]}
Coordinates are integers from 0 to 1000 normalized to this image, origin
top-left, Y down, and ordered minX, minY, maxX, maxY.
For \`text\`, return only the sensitive value or a short description of the
redacted content. Do not include a field label or surrounding instructions.

Err toward boxes being slightly too large rather than too small.
For photos, cover the entire visible photo, including faded or ghost images.
For example, return \`03005988\`, not \`Passport card number 03005988\`.`;
}

const redactionPrompt = makeRedactionPrompt();

function mapRedactionBoxToBoundingBox(
  rawBox: RedactionBoxContent
): SinglePageRedactionBoundingBox {
  const boundingBox: SinglePageRedactionBoundingBox = {
    type: 'automatic',
    dataType: rawBox.dataType,
    text: rawBox.text,
    box: {
      minX: rawBox.minX / 1000,
      minY: rawBox.minY / 1000,
      maxX: rawBox.maxX / 1000,
      maxY: rawBox.maxY / 1000,
    },
    enabled: true,
  };
  return boundingBox;
}
