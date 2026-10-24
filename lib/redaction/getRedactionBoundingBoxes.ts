import { z } from 'zod';
import {
  createOpenAICompatibleCompletion,
  type OpenAICompatibleCompletionCost,
  type OpenAICompatibleCompletionResult,
  OpenAICompatibleProvider,
} from '../ai/createOpenAICompatibleCompletion';
import {
  type BoundingBox,
  type SinglePageRedactionBoundingBox,
  RedactedDataType,
  RedactionBoundingBoxType,
} from './redactionTypes';
import { redactionBoundingBoxesModel } from './redactionBoundingBoxesModel';

/** Redaction boxes and token usage returned for one page. */
export interface GetRedactionBoundingBoxesResult {
  boxes: SinglePageRedactionBoundingBox[];
  /** Same value as `response.cost`, for callers that only need the price. */
  cost: OpenAICompatibleCompletionCost;
  response: OpenAICompatibleCompletionResult;
}

/**
 * Detect identifying or sensitive content in one page image.
 *
 * Coordinates are integers from 0 through 1000 in the model response, then
 * converted to the normalized coordinates used by the app. Text boxes grow by
 * a share of their line height, so they cover the glyphs fully.
 *
 * Uses `redactionBoundingBoxesModel` at low reasoning effort.
 */
export async function getRedactionBoundingBoxes(
  image: Uint8Array
): Promise<GetRedactionBoundingBoxesResult> {
  const response = await requestRedactionVision({
    imageDataURL: makeImageDataURL(image),
    prompt: redactionPrompt,
    responseSchema: redactionResponseJSONSchema,
  });
  const { boxes } = parseRedactionResponse(
    response.choices[0]?.message.content
  );

  return {
    boxes: boxes.map(mapRedactionBoxToBoundingBox),
    cost: response.cost,
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
  object: RedactionObject;
}

/** Text in the box, with the height of one of its lines. */
interface RedactionTextObject {
  type: 'text';
  /** Line height in the same 0–1000 units as the box coordinates. */
  lineHeightY: number;
}

/** What a box covers. Text boxes grow; the other kinds keep the drawn box. */
type RedactionObject = RedactionTextObject | 'formField' | 'other';

interface RedactionResponse {
  boxes: RedactionBoxContent[];
}

/**
 * Zod schema kept next to the vision response parser because the browser
 * never needs the model's wire-format validation details.
 */
const redactedDataTypeSchema: z.ZodType<RedactedDataType> =
  z.enum(RedactedDataType);

/**
 * Prompt-only explanations for each sensitive-data category. Keep these
 * server-side so the client bundle only receives the enum values it renders.
 */
const redactedDataTypeToDescription: Record<RedactedDataType, string> = {
  [RedactedDataType.personName]:
    "A person's name, including surnames, given names, and initials.",
  [RedactedDataType.organizationName]:
    'A company, employer, school, or other organization name.',
  [RedactedDataType.address]:
    'A physical or mailing address, or a place of birth.',
  [RedactedDataType.email]: 'An email address.',
  [RedactedDataType.phone]: 'A phone or fax number.',
  [RedactedDataType.dateOfBirth]: 'A date of birth.',
  [RedactedDataType.issueDate]:
    'The date a document or identification was issued.',
  [RedactedDataType.expiryDate]:
    'The date a document or identification expires.',
  [RedactedDataType.idNumber]:
    'A unique identifier such as an SSN, ITIN, passport number, driver license, A-number, vehicle VIN, or license plate.',
  [RedactedDataType.accountNumber]:
    'A financial or customer account number, including bank accounts, routing numbers, credit cards, and IBAN.',
  [RedactedDataType.documentOrCaseId]:
    'A case, docket, or file number that identifies a specific matter or person. Omit generic printed form titles such as "Form 1040"; this type is often left visible.',
  [RedactedDataType.dollarAmount]:
    'A currency amount, such as wages, a balance, or a transaction total.',
  [RedactedDataType.sensitiveQuantity]:
    'A non-monetary quantity that could be sensitive, such as a number of shares or units owned, size of a house, etc.',
  [RedactedDataType.username]: 'An online username, handle, or login.',
  [RedactedDataType.url]:
    'A personal or identifying URL, such as a profile page or a link that contains a name or account. Do not include generic public websites.',
  [RedactedDataType.health]:
    'Health information, including diagnoses, medications, and medical record numbers.',
  [RedactedDataType.personPhoto]:
    'A photograph of a person, including passport and ID portraits.',
  [RedactedDataType.signature]: 'A handwritten or digital signature.',
  [RedactedDataType.barcode]: 'A barcode or QR code.',
  [RedactedDataType.checkbox]:
    'A checkbox square in a group whose selection reveals something personal, such as race, ethnicity, eye color, sex, health, or religion. Cover the square only, not its label.',
  [RedactedDataType.other]:
    'Other content that could identify or embarrass someone and does not fit a more specific type.',
};

const redactionCoordinateSchema = z.number().finite().int().min(0).max(1000);

// Keep at least 1 so a zero line height can't skip the text box padding.
const redactionLineHeightSchema = z.number().finite().min(1).max(1000);

const redactionObjectSchema: z.ZodType<RedactionObject> = z.union([
  z.object({
    type: z.literal('text'),
    lineHeightY: redactionLineHeightSchema,
  }),
  // One enum for the two string-only kinds, so the JSON schema stays one list.
  z.enum(['formField', 'other']),
]);

const redactionBoxSchema: z.ZodType<RedactionBoxContent> = z
  .object({
    dataType: redactedDataTypeSchema,
    text: z.string(),
    minX: redactionCoordinateSchema,
    minY: redactionCoordinateSchema,
    maxX: redactionCoordinateSchema,
    maxY: redactionCoordinateSchema,
    object: redactionObjectSchema,
  })
  .refine(
    ({ minX, minY, maxX, maxY }) => minX < maxX && minY < maxY,
    'Redaction box coordinates must have positive width and height.'
  );

const redactionResponseSchema: z.ZodType<RedactionResponse> = z.object({
  boxes: redactionBoxSchema.array(),
});

/** Inputs for one vision request. */
interface RequestRedactionVisionOptions {
  imageDataURL: string;
  prompt: string;
  responseSchema: Record<string, unknown>;
}

function requestRedactionVision({
  imageDataURL,
  prompt,
  responseSchema,
}: RequestRedactionVisionOptions): ReturnType<
  typeof createOpenAICompatibleCompletion
> {
  return createOpenAICompatibleCompletion({
    provider: OpenAICompatibleProvider.gemini,
    model: redactionBoundingBoxesModel,
    reasoning_effort: 'low',
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

const dataTypeLines = Object.values(RedactedDataType)
  .map(
    (dataType): string =>
      `- ${dataType}: ${redactedDataTypeToDescription[dataType]}`
  )
  .join('\n');

const redactionPrompt = `Find every item on this page that could identify or embarrass someone
and should be redacted. Err toward over-redacting, including faded, blurred,
or scanned-in content.

Classify each box with exactly one of these dataType values:
${dataTypeLines}

Return only this JSON shape:
{"boxes":[{"dataType":"personName","text":"visible text or description","minX":0,"minY":0,"maxX":0,"maxY":0,"object":{"type":"text","lineHeightY":20}}]}
Coordinates are integers from 0 to 1000, normalized to this image, with the
origin at the top-left, ordered minX, minY, maxX, maxY. Make boxes slightly too
large rather than too small.

Set object to what the box covers:
- {"type":"text","lineHeightY":N}: printed or handwritten text. N is the height
  of one line of that text, in the same 0 to 1000 units as minY and maxY. For a
  multi-line box, use the height of one line. For vertical or rotated text, N is
  still the height of one glyph, not the length of the text.
- "formField": a printed form field, such as an entry box, a line, a row of
  character cells, or a checkbox square.
- "other": anything else, such as a photo, signature, barcode, or graphic.


How big to make the box:
- Form fields: box the entire printed field (the entry box, line, or row of
  character cells), not just the typed text, so the box size doesn't reveal the
  length of the value.
- Checkbox/radio groups: if the checkboxes relate to sensitive/embarrassing
  info, box every square in the group, checked or not, with the square only, not
  its label. Use each option's printed label as \`text\`, not "checked" or
  "unchecked".
- Photos: cover the entire visible photo, including faded or ghost images.
- Text: cover the entire text, including descenders, ascenders, accent marks.
  Try to maybe cover _slightly beyond the text_: expand it into the whitespace
  slightly to avoid missing anything.

When to redact and when not to redact:
- Specificity: redact details that give lots of bits of info about a person:
  - Highly specific: (redact)
    - Marriage date
    - Birth date
    - Home address
    - Bank balance
    - Invoice amount
  - Borderline specific: shared by quite a few people, but still can be used
    together with other bits of info to identify a person (redact)
    - City of residence
    - Specialty at one employer (e.g., "Cardiologist at UCSF")
  - Not specific: (leave alone)
    - Date of a transaction if hundreds of people probably made a transaction
      at this retailer on that date
    - Amount or fact that many people share (e.g., country of residence, fact
      they own a dog, profession as "Physician" without place of work)

For the redacted value, return ONLY the sensitive value, not the form field
label, etc.: e.g., return \`03005988\`, not \`Passport card number 03005988\`.
Remove empty spaces (e.g., even if represented in file as "0 3 0 5", return
"0305").`;

function mapRedactionBoxToBoundingBox(
  rawBox: RedactionBoxContent
): SinglePageRedactionBoundingBox {
  const box: BoundingBox = {
    minX: rawBox.minX / 1000,
    minY: rawBox.minY / 1000,
    maxX: rawBox.maxX / 1000,
    maxY: rawBox.maxY / 1000,
  };
  const boundingBox: SinglePageRedactionBoundingBox = {
    type: RedactionBoundingBoxType.automatic,
    dataType: rawBox.dataType,
    text: rawBox.text,
    box:
      rawBox.object === 'formField' || rawBox.object === 'other'
        ? box
        : expandTextBox(box, rawBox.object.lineHeightY / 1000),
    enabled: true,
  };
  return boundingBox;
}

/**
 * Grow a text box past the glyphs. Padding is a share of the line height, so
 * it scales with the text size.
 *
 * Padding uses normalized units on both axes, so the horizontal padding is
 * not a true 1/4 line height on pages whose width and height differ.
 */
function expandTextBox(box: BoundingBox, lineHeight: number): BoundingBox {
  const verticalPadding = lineHeight / 8;
  const horizontalPadding = lineHeight / 4;
  return {
    minX: Math.max(0, box.minX - horizontalPadding),
    minY: Math.max(0, box.minY - verticalPadding),
    maxX: Math.min(1, box.maxX + horizontalPadding),
    maxY: Math.min(1, box.maxY + verticalPadding),
  };
}
