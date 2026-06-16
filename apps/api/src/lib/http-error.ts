/**
 * Error that carries an HTTP status. Services throw it (e.g. notFound) and the
 * error middleware turns it into the right `{ error }` envelope + status code.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message = 'Resource not found') => new HttpError(404, message);
