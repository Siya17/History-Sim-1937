export class ServerError extends Error {}
export async function api<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/classroom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || data.error)
    throw new ServerError(data.error ?? "Request failed");
  return data as T;
}
