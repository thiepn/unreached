export function readHashSearchParams(hash = window.location.hash): URLSearchParams {
  const query = hash.replace(/^#/, "").split("?", 2)[1] ?? "";
  return new URLSearchParams(query);
}

export function positiveHashPage(params: URLSearchParams, key = "page"): number {
  const raw = params.get(key);
  if (!raw) return 1;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

export function hashPath(hash = window.location.hash): string {
  const raw = hash.replace(/^#/, "").split("?", 1)[0]?.trim() ?? "";
  if (!raw || raw === "/") return "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function replaceHashSearchParams(params: URLSearchParams): void {
  const query = params.toString();
  const nextHash = `#${hashPath()}${query ? `?${query}` : ""}`;
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` === nextUrl) return;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export function setOptionalHashParam(params: URLSearchParams, key: string, value: string | number | null | undefined, defaultValue: string | number | null = null): void {
  const text = value === null || value === undefined ? "" : String(value);
  const defaultText = defaultValue === null || defaultValue === undefined ? "" : String(defaultValue);
  if (!text || text === defaultText) params.delete(key);
  else params.set(key, text);
}
