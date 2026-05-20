export const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isBodyMethod = options?.method && !["GET", "HEAD"].includes(options.method);
  const headers: Record<string, string> = {};
  if (isBodyMethod) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = Array.isArray(err.detail)
      ? err.detail.map((e: { loc: string[]; msg: string }) => `${e.loc?.join(".")}: ${e.msg}`).join(" | ")
      : err.detail || `Erro ${res.status}`;
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};
