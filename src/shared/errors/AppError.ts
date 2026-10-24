class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  // status code padrão é 400
  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export default AppError;
