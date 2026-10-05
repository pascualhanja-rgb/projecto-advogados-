import { API_URL } from "./api";

/** Converte caminhos relativos de upload (/uploads/...) em URLs absolutos. */
export function assetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_URL.replace(/\/api\/v1\/?$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function imageUrl(url?: string | null): string | undefined {
  return assetUrl(url);
}
