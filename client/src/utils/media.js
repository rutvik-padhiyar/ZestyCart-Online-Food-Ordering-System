export function resolveMediaUrl(path, apiBase, fallback = "placeholder-restaurant.svg") {
  if (!path) return `${apiBase}/uploads/${fallback}`;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${apiBase}/uploads/${path}`;
}
