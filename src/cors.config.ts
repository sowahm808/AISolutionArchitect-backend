export function getAllowedOrigins() {
  return (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins = getAllowedOrigins(),
) {
  return (
    !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)
  );
}
