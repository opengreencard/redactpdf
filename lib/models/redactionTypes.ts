import { z } from 'zod';

/** Current processing state for an uploaded redaction document. */
export enum RedactionStatus {
  redacting = 'redacting',
  redacted = 'redacted',
  error = 'error',
}

/**
 * Categories of sensitive content the vision model can mark for redaction.
 * Stored values stay stable so the prompt, Zod schema, and review UI share
 * one set of identifiers.
 */
export enum RedactedDataType {
  personName = 'personName',
  organizationName = 'organizationName',
  address = 'address',
  email = 'email',
  phone = 'phone',
  dateOfBirth = 'dateOfBirth',
  issueDate = 'issueDate',
  expiryDate = 'expiryDate',
  idNumber = 'idNumber',
  accountNumber = 'accountNumber',
  documentOrCaseId = 'documentOrCaseId',
  dollarAmount = 'dollarAmount',
  sensitiveQuantity = 'sensitiveQuantity',
  username = 'username',
  url = 'url',
  health = 'health',
  personPhoto = 'personPhoto',
  signature = 'signature',
  barcode = 'barcode',
  other = 'other',
}

/**
 * Zod schema kept in sync with {@link RedactedDataType}.
 * Annotated as `z.ZodType<RedactedDataType>` so the readable TypeScript enum
 * remains the source of truth, matching the immigration form-type pattern.
 */
export const redactedDataTypeSchema: z.ZodType<RedactedDataType> =
  z.enum(RedactedDataType);

/**
 * Instructional labels used in the vision prompt. `Record<RedactedDataType, _>`
 * makes a missing or extra key a compile error when the enum changes.
 */
export const redactedDataTypeToDescription: Record<RedactedDataType, string> = {
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
  [RedactedDataType.other]:
    'Other content that could identify or embarrass someone and does not fit a more specific type.',
};

/** Pixel size of one rasterized redaction page image. */
export interface PageSize {
  /** Image width in pixels. */
  width: number;
  /** Image height in pixels. */
  height: number;
}

/** Normalized coordinates for a box on an upright page image. */
export interface BoundingBox {
  // Coordinates are normalized to 0–1, with the origin at the top-left.
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Fields shared by automatic and manually-created redaction boxes. */
export interface RedactionBoundingBoxCommon {
  box: BoundingBox;
  page: number;
  enabled: boolean;
}

/** An automatic redaction box before it is assigned to a page. */
export interface SinglePageRedactionBoundingBox {
  type: 'automatic';
  dataType: RedactedDataType;
  text: string;
  box: BoundingBox;
  enabled: boolean;
}

/** A redaction suggestion produced by the vision model on a specific page. */
export interface AutoRedactionBoundingBox extends SinglePageRedactionBoundingBox {
  page: number;
}

/** A redaction box drawn by the user. */
export interface ManualRedactionBoundingBox extends RedactionBoundingBoxCommon {
  type: 'manual';
}

/** A redaction box from either the automatic or manual workflow. */
export type RedactionBoundingBox =
  AutoRedactionBoundingBox | ManualRedactionBoundingBox;

/**
 * Browser-safe polling payload. Incomplete and failed jobs share
 * {@link GenericGetRedactionResponse}; only a finished job includes page
 * image sizes.
 */
export type GetRedactionResponse =
  GenericGetRedactionResponse | RedactedGetRedactionResponse;

/**
 * Response while processing is still running or after it failed.
 * Boxes are omitted so the review UI cannot render a half-built list.
 */
export interface GenericGetRedactionResponse extends GetRedactionResponseCommon {
  status: RedactionStatus.redacting | RedactionStatus.error;
}

/** Response after page images and redaction suggestions are available. */
export interface RedactedGetRedactionResponse extends GetRedactionResponseCommon {
  status: RedactionStatus.redacted;
  pageSizes: PageSize[];
  redactionBoundingBoxes: RedactionBoundingBox[];
}

/** Fields shared by every browser-safe redaction response. */
interface GetRedactionResponseCommon {
  pageCount: number;
  createdAt: string;
}
