import {
  box,
  type BoxCoordinates,
  image,
  TypeSafeClient,
} from '@typesafe-ai/sdk';

/**
 * Jev release used for Box questions. Pinned because the `jev-preview` alias
 * moves when a newer build ships, and Box accuracy changes between releases.
 * Box needs Jev 1.14 or newer.
 */
export const typeSafeBoxModel = 'jev-1.14.0';

/** Inputs for one Box question about a cropped image. */
export interface AskTypeSafeBoxOptions {
  /** PNG or JPEG bytes of the crop. */
  crop: Uint8Array;
  /** What to find in the crop, such as "the person name in `crop`". */
  instructions: string;
}

/** The box Jev found, plus the usage needed to estimate cost. */
export interface TypeSafeBoxAnswer {
  /** Edges as fractions of the crop's width and height, from the top-left. */
  box: BoxCoordinates;
  /** Null when the API doesn't report confidence. */
  confidence: number | null;
  /** Null when the API doesn't report usage. */
  inputTokens: number | null;
}

/**
 * Ask Jev for the box around one target in a cropped image.
 *
 * Box answers always contain a box, even when the target is missing, so
 * callers should check the crop edges and the approximate box before using it.
 */
export async function askTypeSafeBox({
  crop,
  instructions,
}: AskTypeSafeBoxOptions): Promise<TypeSafeBoxAnswer> {
  const { answers, usage } = await getOrCreateTypeSafeClient().systemOne({
    model: typeSafeBoxModel,
    state: { crop: image(crop) },
    questions: { target: box(instructions) },
  });
  return {
    box: answers.target.box,
    confidence: answers.target.confidence,
    inputTokens: usage.input_tokens,
  };
}

let typeSafeClient: TypeSafeClient | null = null;

/**
 * Create the client on first use so importing this module doesn't need the
 * API key. The SDK reads `TYPESAFE_API_KEY` from the environment.
 */
function getOrCreateTypeSafeClient(): TypeSafeClient {
  if (typeSafeClient) return typeSafeClient;

  typeSafeClient = new TypeSafeClient({
    // Box calls can take a few seconds on large crops. The SDK's 10 second
    // default is too short under load.
    timeout: 60_000,
    // Box questions are behind a danger-zone header until the API is
    // production ready. See https://docs.typesafe.ai/images
    defaultHeaders: { 'TypeSafe-Danger-Zone-Images': 'true' },
  });
  return typeSafeClient;
}
