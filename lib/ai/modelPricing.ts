/** USD list price per 1M tokens for one model, for one span of time. */
interface ModelPricingEntry {
  inputUSDPerMillionTokens: number;
  outputUSDPerMillionTokens: number;
  /**
   * When these prices stop applying. Omit it on the last entry for a model, so
   * that entry covers all later times.
   */
  introductoryPeriodEndTime?: Date;
}

/**
 * Returns the prices in effect at `now`, or null when no entry applies.
 *
 * Entries are in time order, so the first one whose cutoff hasn't passed wins.
 */
export function getModelPricing(
  model: string,
  now: Date
): ModelPricingEntry | null {
  const entries = modelPricingByName[model] ?? [];
  return (
    entries.find(
      (entry) =>
        !entry.introductoryPeriodEndTime ||
        now < entry.introductoryPeriodEndTime
    ) ?? null
  );
}

/**
 * Current paid-tier list prices from
 * https://ai.google.dev/gemini-api/docs/pricing, checked 2026-10-23.
 *
 * Cutoffs are midnight Pacific time. When a model's price changes again, add
 * another entry at the end and set the previous entry's cutoff.
 */
const modelPricingByName: Record<string, ModelPricingEntry[]> = {
  'gemini-4-argon': [
    {
      inputUSDPerMillionTokens: 2,
      outputUSDPerMillionTokens: 10,
      introductoryPeriodEndTime: new Date('2026-12-01T00:00:00-08:00'),
    },
    { inputUSDPerMillionTokens: 4, outputUSDPerMillionTokens: 20 },
  ],
  'gemini-3.8-flash': [
    {
      inputUSDPerMillionTokens: 0.75,
      outputUSDPerMillionTokens: 3.75,
      introductoryPeriodEndTime: new Date('2027-01-01T00:00:00-08:00'),
    },
    { inputUSDPerMillionTokens: 1.5, outputUSDPerMillionTokens: 7.5 },
  ],
};
