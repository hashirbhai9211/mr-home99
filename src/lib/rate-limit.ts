type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & { __mrhRate?: Map<string, Bucket> };
const store = globalStore.__mrhRate ?? new Map<string, Bucket>();
globalStore.__mrhRate = store;

function sweep() {
  if (store.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of store) if (v.resetAt < now) store.delete(k);
}

/** Fixed-window in-memory rate limiter. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  sweep();
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

/** Login throttling: 5 failures / 15 minutes → lockout. */
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW = 15 * 60 * 1000;

export function loginLockStatus(key: string) {
  const b = store.get(`login:${key}`);
  const now = Date.now();
  if (!b || b.resetAt < now) return { locked: false, retryAfter: 0, failures: 0 };
  return { locked: b.count >= LOGIN_LIMIT, retryAfter: Math.ceil((b.resetAt - now) / 1000), failures: b.count };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const k = `login:${key}`;
  const b = store.get(k);
  if (!b || b.resetAt < now) store.set(k, { count: 1, resetAt: now + LOGIN_WINDOW });
  else b.count += 1;
}

export function clearLoginFailures(key: string) {
  store.delete(`login:${key}`);
}
