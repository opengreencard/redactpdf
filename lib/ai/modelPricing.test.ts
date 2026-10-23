import { getModelPricing } from './modelPricing';

describe('getModelPricing', () => {
  // One second before the cutoff, introductory prices apply.
  it('uses introductory prices before the cutoff', () => {
    expect(
      getModelPricing('gemini-4-argon', new Date('2026-11-30T23:59:59Z'))
    ).toMatchObject({
      inputUSDPerMillionTokens: 2,
      outputUSDPerMillionTokens: 10,
    });
  });

  // At the cutoff, the standard prices apply.
  it('uses standard prices at and after the cutoff', () => {
    expect(
      getModelPricing('gemini-4-argon', new Date('2026-12-01T00:00:00Z'))
    ).toMatchObject({
      inputUSDPerMillionTokens: 4,
      outputUSDPerMillionTokens: 20,
    });
  });
});
