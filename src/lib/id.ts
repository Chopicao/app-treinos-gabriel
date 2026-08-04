let fallbackCounter = 0;

/** Stable-enough unique id. Uses `crypto.randomUUID` when available. */
export function createId(prefix = ''): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${(fallbackCounter += 1).toString(36)}-${Math.floor(
          Math.random() * 1e9,
        ).toString(36)}`;
  return prefix ? `${prefix}_${uuid}` : uuid;
}
