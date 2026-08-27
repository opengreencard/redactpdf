import {
  createOpenAICompatibleCompletion,
  OpenAICompatibleProvider,
} from './createOpenAICompatibleCompletion';

describe('createOpenAICompatibleCompletion', () => {
  it('returns a simple completion from Gemini 3.5 Flash Lite', async () => {
    const response = await createOpenAICompatibleCompletion({
      provider: OpenAICompatibleProvider.gemini,
      model: 'gemini-3.5-flash-lite',
      messages: [{ role: 'user', content: 'What is 1 + 1' }],
      max_tokens: 1_024,
    });

    expect(response.choices[0]?.message.content?.trim()).toContain('2');
    expect(response).toMatchObject({
      object: 'chat.completion',
      choices: expect.any(Array),
      usage: {
        prompt_tokens: expect.any(Number),
        completion_tokens: expect.any(Number),
      },
    });
    expect(response.timing).toEqual({
      msToFirstToken: expect.any(Number),
      outputTokensPerSecond: expect.any(Number),
      totalTimeMs: expect.any(Number),
    });
  }, 60_000);
});
