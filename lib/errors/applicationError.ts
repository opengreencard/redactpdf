/**
 * An expected error from our application that should not trigger
 * any alerts, etc.
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}
