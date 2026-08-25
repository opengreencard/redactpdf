/** Current processing state for an uploaded redaction document. */
export enum RedactionStatus {
  redacting = 'redacting',
  redacted = 'redacted',
  error = 'error',
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

/** A redaction suggestion produced by the vision model. */
export interface AutoRedactionBoundingBox extends RedactionBoundingBoxCommon {
  type: 'automatic';
  dataType: string;
  text: string;
}

/** A redaction box drawn by the user. */
export interface ManualRedactionBoundingBox extends RedactionBoundingBoxCommon {
  type: 'manual';
}

/** A redaction box from either the automatic or manual workflow. */
export type RedactionBoundingBox =
  AutoRedactionBoundingBox | ManualRedactionBoundingBox;

/** Browser-safe response returned while a redaction is being processed. */
export interface GetRedactionResponse {
  status: RedactionStatus;
  pageCount: number;
  redactionBoundingBoxes: RedactionBoundingBox[];
  createdAt: string;
}
