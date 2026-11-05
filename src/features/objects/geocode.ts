export type MapPoint = { lat: number; lng: number };

const cache = new Map<string, MapPoint | null>();
const inflight = new Map<string, Promise<MapPoint | null>>();
let lastRequestAt = 0;
let queue = Promise.resolve();

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueue<T>(job: () => Promise<T>) {
  const run = queue.then(async () => {
    const wait = Math.max(0, 1500 - (Date.now() - lastRequestAt));
    if (wait) await pause(wait);
    lastRequestAt = Date.now();
    return job();
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function normalizeAddress(address: string) {
  const swaps: [RegExp, string][] = [
    [/(^|[\s,])пр-т\./gi, "$1проспект"],
    [/(^|[\s,])просп\./gi, "$1проспект"],
    [/(^|[\s,])пр\./gi, "$1проспект"],
    [/(^|[\s,])ул\./gi, "$1улица"],
    [/(^|[\s,])пер\./gi, "$1переулок"],
    [/(^|[\s,])мкр\./gi, "$1микрорайон"],
    [/(^|[\s,])наб\./gi, "$1набережная"],
    [/(^|[\s,])ш\./gi, "$1шоссе"],
    [/(^|[\s,])пл\./gi, "$1площадь"],
  ];
  return swaps.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    address,
  );
}

async function lookup(address: string): Promise<MapPoint | null> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt) await pause(1500 * attempt);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", normalizeAddress(address));
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "1");
      const response = await fetch(url);
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error("Карта сейчас недоступна");
        continue;
      }
      if (!response.ok) throw new Error("Карта сейчас недоступна");
      const rows = (await response.json()) as { lat?: string; lon?: string }[];
      const hit = rows[0];
      const lat = Number(hit?.lat);
      const lng = Number(hit?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Карта сейчас недоступна");
}

export function geocodeAddress(address: string) {
  const key = address.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);
  const existing = inflight.get(key);
  if (existing) return existing;
  const request = enqueue(() => lookup(address))
    .then((point) => {
      cache.set(key, point);
      inflight.delete(key);
      return point;
    })
    .catch((error: unknown) => {
      inflight.delete(key);
      throw error;
    });
  inflight.set(key, request);
  return request;
}
