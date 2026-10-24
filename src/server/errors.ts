export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
export function errorResponse(error: unknown) {
  return error instanceof HttpError
    ? json(
        { success: false, message: error.message, errors: error.errors },
        error.status,
      )
    : json(
        {
          success: false,
          message: "Služba je dočasně nedostupná. Zkuste to znovu.",
        },
        503,
      );
}
