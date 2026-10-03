import type { BoundingBox } from '../models/redactionTypes';
import { RedactionBoundingBoxType } from '../models/redactionTypes';

/**
 * One kind of box edit the client can persist. Add draws a new box; delete
 * and setEnabled look up an existing one.
 */
export enum RedactionBoundingBoxMutationOp {
  add = 'add',
  delete = 'delete',
  setEnabled = 'setEnabled',
}

/**
 * One box edit in a batch. The server applies these in order and saves
 * once.
 */
export type RedactionBoundingBoxMutation =
  | AddRedactionBoundingBoxMutation
  | DeleteRedactionBoundingBoxMutation
  | SetRedactionBoundingBoxEnabledMutation;

/** Page plus coordinates shared by add and by lookups of an existing box. */
interface RedactionBoundingBoxPageAndBox {
  page: number;
  box: BoundingBox;
}

/**
 * Identity of an existing box. Delete and setEnabled look up this way.
 *
 * Keep in sync with `isSameRedactionBoundingBox` in
 * `redactionBoundingBoxIdentity.ts`.
 */
interface LocateRedactionBoundingBoxRequest extends RedactionBoundingBoxPageAndBox {
  type: RedactionBoundingBoxType;
}

/**
 * Draw a new box. Callers don't send `type` — we always create `manual`.
 */
interface AddRedactionBoundingBoxMutation extends RedactionBoundingBoxPageAndBox {
  op: RedactionBoundingBoxMutationOp.add;
}

/** Drop a box the user dismissed or undid. */
interface DeleteRedactionBoundingBoxMutation extends LocateRedactionBoundingBoxRequest {
  op: RedactionBoundingBoxMutationOp.delete;
}

/**
 * Write `enabled` to a specific value so a missed request cannot invert the
 * next click.
 */
interface SetRedactionBoundingBoxEnabledMutation extends LocateRedactionBoundingBoxRequest {
  op: RedactionBoundingBoxMutationOp.setEnabled;
  enabled: boolean;
}
