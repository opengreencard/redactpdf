import {
  AutoRedactionBoundingBox,
  BoundingBox,
  ManualRedactionBoundingBox,
} from '../models/redactionTypes';

/** Browser-safe fixture builders for redaction types used in tests and stories. */
// Keep the builder collection inferred so its public keys stay synchronized
// with the builders defined in this module.
// eslint-disable-next-line no-restricted-syntax
const ClientFakeData = {
  makeBoundingBox,
  makeAutoRedactionBoundingBox,
  makeManualRedactionBoundingBox,
};

export default ClientFakeData;

function makeBoundingBox(options: Partial<BoundingBox> = {}): BoundingBox {
  return {
    minX: options.minX ?? 0.1,
    minY: options.minY ?? 0.2,
    maxX: options.maxX ?? 0.4,
    maxY: options.maxY ?? 0.3,
  };
}

function makeAutoRedactionBoundingBox(
  options: Partial<Omit<AutoRedactionBoundingBox, 'type'>> = {}
): AutoRedactionBoundingBox {
  return {
    type: 'automatic',
    dataType: options.dataType ?? 'person',
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
