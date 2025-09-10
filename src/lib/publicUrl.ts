export function publicUrl(path: string) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}