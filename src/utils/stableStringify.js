function normalizeValue(value, seen) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    throw new TypeError("Cannot serialize a circular structure");
  }

  seen.add(value);

  let normalized;

  if (Array.isArray(value)) {
    normalized = value.map((item) =>
      normalizeValue(item, seen)
    );
  } else {
    normalized = {};

    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) {
        normalized[key] = normalizeValue(
          value[key],
          seen
        );
      }
    }
  }

  seen.delete(value);

  return normalized;
}

export function stableStringify(value) {
  return JSON.stringify(
    normalizeValue(value, new WeakSet())
  );
}