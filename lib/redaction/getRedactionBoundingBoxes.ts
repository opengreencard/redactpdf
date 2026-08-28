import { z } from 'zod';
import {
  annotateJPEGWithRedactionBoxes,
  type RedactionBoxToAnnotate,
} from './annotateJPEGWithRedactionBoxes';
import {
  createOpenAICompatibleCompletion,
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

const redactionCoordinateSchema = z.number().finite().int().min(0).max(1000);

interface RedactionBoxContent {
  dataType: RedactedDataType;
  text: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface RedactionBox extends RedactionBoxContent {
  id: number;
}

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

interface RedactionResponse {
  boxes: RedactionBoxContent[];
}

const redactionResponseSchema: z.ZodType<RedactionResponse> = z.object({
  boxes: redactionBoxSchema.array(),
});

interface RedactionBoxCorrection {
  originalBoxId: number | null;
  correctedBox: RedactionBoxContent | null;
}

const redactionBoxCorrectionSchema: z.ZodType<RedactionBoxCorrection> = z
  .object({
    originalBoxId: z.number().int().positive().nullable(),
    correctedBox: redactionBoxSchema.nullable(),
  })
  .refine(
    ({ originalBoxId, correctedBox }) =>
      originalBoxId !== null || correctedBox !== null,
    'A redaction correction must contain an originalBoxId or correctedBox.'
  );

interface RedactionReviewResponse {
  corrections: RedactionBoxCorrection[];
}

const redactionReviewResponseSchema: z.ZodType<RedactionReviewResponse> =
  z.object({
    corrections: redactionBoxCorrectionSchema.array(),
  });

/** Redaction boxes and token usage returned for one page. */
export interface GetRedactionBoundingBoxesResult {
  boxes: Omit<AutoRedactionBoundingBox, 'page'>[];
  usage: OpenAICompatibleCompletionUsage;
  timing: OpenAICompatibleCompletionTiming;
}

/**
 * Detect identifying or sensitive content in one page image.
 *
 * The first request finds candidate boxes. A second request sees those boxes
 * drawn on the image and can correct, add, or remove them before the result is
 * returned. Coordinates are integers from 0 through 1000 in the model
 * response, then converted to the normalized coordinates used by the app.
 *
 * Gemini 3.7 Flash is intentionally used here because local comparisons show
 * it is more exhaustive at finding sensitive content, including repeated or
 * faint values, than the previous Flash Lite model.
 */
export async function getRedactionBoundingBoxes(
  image: Uint8Array
): Promise<GetRedactionBoundingBoxesResult> {
  const firstResponse = await requestRedactionVision(
    makeImageDataURL(image),
    redactionObjectPrompt,
    redactionObjectResponseJSONSchema
  );

  const firstPassBoxes = parseRedactionResponse(
    firstResponse.choices[0]?.message.content
  ).boxes.map((box, index): RedactionBox => ({
    ...box,
    id: index + 1,
  }));
  const annotatedImage = await annotateJPEGWithRedactionBoxes(
    image,
    firstPassBoxes.map(mapRedactionBoxToAnnotatedBoundingBox)
  );
  const reviewResponse = await requestRedactionVision(
    makeImageDataURL(annotatedImage),
    makeRedactionReviewPrompt(firstPassBoxes),
    redactionReviewResponseJSONSchema
  );
  const { corrections } = parseReviewResponse(
    reviewResponse.choices[0]?.message.content
  );
  const finalBoxes = _combineRedactionBoxes(firstPassBoxes, corrections);
  const totalTimeMs =
    firstResponse.timing.totalTimeMs + reviewResponse.timing.totalTimeMs;
  const completionTokens =
    (firstResponse.usage?.completion_tokens ?? 0) +
    (reviewResponse.usage?.completion_tokens ?? 0);

  return {
    boxes: finalBoxes.map(mapRedactionBoxToBoundingBox),
    usage: {
      inputTokens:
        (firstResponse.usage?.prompt_tokens ?? 0) +
        (reviewResponse.usage?.prompt_tokens ?? 0),
      reasoningTokens:
        (firstResponse.usage?.completion_tokens_details?.reasoning_tokens ??
          0) +
        (reviewResponse.usage?.completion_tokens_details?.reasoning_tokens ??
          0),
      completionTokens,
    },
    timing: {
      msToFirstToken: firstResponse.timing.msToFirstToken,
      outputTokensPerSecond:
        totalTimeMs > 0 ? (completionTokens / totalTimeMs) * 1_000 : 0,
      totalTimeMs,
    },
  };
}

/**
 * Apply review corrections to the first-pass boxes.
 *
 * A correction with an originalBoxId and correctedBox replaces that ID, a
 * correction with only correctedBox adds a box, and one with only originalBoxId
 * removes it.
 * Exported for tests.
 */
export function _combineRedactionBoxes(
  initialBoxes: RedactionBox[],
  corrections: RedactionBoxCorrection[]
): RedactionBox[] {
  const finalBoxes = [...initialBoxes];
  let nextBoxNumber = initialBoxes.length + 1;
  for (const { originalBoxId, correctedBox } of corrections) {
    if (originalBoxId === null) {
      if (correctedBox !== null) {
        const addedBox: RedactionBox = {
          ...correctedBox,
          id: nextBoxNumber,
        };
        finalBoxes.push(addedBox);
        nextBoxNumber += 1;
      }
      continue;
    }

    const originalIndex = finalBoxes.findIndex(
      (box) => box.id === originalBoxId
    );
    if (originalIndex === -1) continue;
    if (correctedBox === null) {
      finalBoxes.splice(originalIndex, 1);
    } else {
      const replacementBox: RedactionBox = {
        ...correctedBox,
        id: originalBoxId,
      };
      finalBoxes[originalIndex] = replacementBox;
    }
  }
  return finalBoxes;
}

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

function parseReviewResponse(
  content: string | null | undefined
): RedactionReviewResponse {
  return redactionReviewResponseSchema.parse(JSON.parse(content ?? ''));
}

function makeRedactionObjectResponseJSONSchema(): Record<string, unknown> {
  const schema: Record<string, unknown> = z.toJSONSchema(
    redactionResponseSchema
  );
  delete schema.$schema;
  return schema;
}

function makeRedactionReviewResponseJSONSchema(): Record<string, unknown> {
  const schema: Record<string, unknown> = z.toJSONSchema(
    redactionReviewResponseSchema
  );
  delete schema.$schema;
  return schema;
}

const redactionObjectResponseJSONSchema =
  makeRedactionObjectResponseJSONSchema();
const redactionReviewResponseJSONSchema =
  makeRedactionReviewResponseJSONSchema();

function makeImageDataURL(image: Uint8Array): string {
  return `data:image/jpeg;base64,${Buffer.from(image).toString('base64')}`;
}

function makeRedactionObjectPrompt(): string {
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

Make every text box large enough to include every visible character, including
the full value in a row or column; never crop the first or last character.
For photos, cover the entire visible photo, including faded or ghost images.
For example, return \`03005988\`, not \`Passport card number 03005988\`.`;
}

const redactionObjectPrompt = makeRedactionObjectPrompt();

function makeRedactionReviewPrompt(redactionBoxes: RedactionBox[]): string {
  return `${redactionObjectPrompt}

Here is the redaction of this image based on the prompt above. Review every red
box against the underlying image. The first-pass boxes have these stable IDs:
${JSON.stringify(redactionBoxes)}

The red outlines and yellow numeric IDs are review overlays, not document
content. Ignore them when deciding what should be redacted. Check especially
for these common errors:

- A box clips characters at the beginning or end of a value.
- A box covers a field label or column heading but misses the value beside or
  below it.
- A row contains multiple values and only one value is boxed.
- Faded, blurred, ghosted, or scan-artifact text or photos were left visible.

Are any redaction boxes incorrect? If so, return an object with corrections.
Use originalBoxId to identify the first-pass box being corrected or removed.
Use originalBoxId: null for a newly added box.

Return only this JSON shape:
{"corrections":[{"originalBoxId":1,"correctedBox":{"dataType":"personName","text":"Jane Doe","minX":0,"minY":0,"maxX":0,"maxY":0}}]}

For a corrected box, include its originalBoxId and corrected coordinates. For an
added box, set originalBoxId to null. For a removed box, set correctedBox to
null. For text, return only the sensitive value or a short description; never
include a field label. If all boxes are correct, return an empty corrections
array.`;
}

function mapRedactionBoxToBoundingBox(
  rawBox: RedactionBox
): Omit<AutoRedactionBoundingBox, 'page'> {
  const boundingBox: Omit<AutoRedactionBoundingBox, 'page'> = {
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

function mapRedactionBoxToAnnotatedBoundingBox(
  rawBox: RedactionBox
): RedactionBoxToAnnotate {
  const boundingBox: RedactionBoxToAnnotate = {
    ...mapRedactionBoxToBoundingBox(rawBox),
    id: rawBox.id,
  };
  return boundingBox;
}
