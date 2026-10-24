class AppError extends Error {
  public readonly statusCode: number;

  // status code padrão é 400
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export default AppError;
