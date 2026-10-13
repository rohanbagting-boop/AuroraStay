export class AppError extends Error {
  constructor(statusCode, message, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const ok = (res, data = null, message = 'OK', status = 200, meta = undefined) =>
  res.status(status).json({ success: true, message, data, meta });

export const created = (res, data, message = 'Created') => ok(res, data, message, 201);

