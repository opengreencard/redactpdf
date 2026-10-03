/** Current processing state for an uploaded redaction document. */
export enum RedactionStatus {
  redacting = 'redacting',
  redacted = 'redacted',
  error = 'error',
}

/**
 * Whether a box came from the vision model or was drawn by the user.
 * Stored values stay stable so mutations can look a box up by type.
 */
export enum RedactionBoundingBoxType {
  automatic = 'automatic',
  manual = 'manual',
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
  type: RedactionBoundingBoxType.automatic;
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
  type: RedactionBoundingBoxType.manual;
}

/** A redaction box from either the automatic or manual workflow. */
export type RedactionBoundingBox =
  AutoRedactionBoundingBox | ManualRedactionBoundingBox;
