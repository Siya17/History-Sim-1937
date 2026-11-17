export class ServerError extends Error {
  constructor(
    message: string,
    public code = "REQUEST_FAILED",
    public params: Record<string, string | number> = {},
  ) {
    super(message);
  }
}
export async function api<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/classroom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || data.error)
    throw new ServerError(
      data.error ?? "Request failed",
      data.errorCode,
      data.errorParams,
    );
  return data as T;
}
