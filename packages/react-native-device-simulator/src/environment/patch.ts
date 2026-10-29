const warned = new Set<string>();

/**
 * Replaces `target[key]`, falling back to `Object.defineProperty` for modules
 * whose exports are getters. Returns false (and warns once) when the property
 * cannot be replaced, so the simulation degrades instead of crashing.
 */
export function patchProperty<T extends object>(target: T, key: string, value: unknown): boolean {
  const record = target as Record<string, unknown>;
  try {
    record[key] = value;
    if (record[key] === value) return true;
  } catch {
    // Fall through to defineProperty.
  }
  try {
    Object.defineProperty(target, key, { configurable: true, enumerable: true, writable: true, value });
    if (record[key] === value) return true;
  } catch {
    // Not patchable.
  }
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(`[device-simulator] Could not patch "${key}"; this part of the simulation is disabled.`);
  }
  return false;
}
