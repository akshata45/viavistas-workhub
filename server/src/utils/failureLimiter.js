// Counts failed attempts (for example wrong passwords) and blocks a key
// for a while once it fails too often. It lives in memory, so counts reset
// when the server restarts, which is fine for a single server.
//
//   const limiter = createFailureLimiter({ maxFailures: 5, windowMs: 900000 });
//   limiter.retryAfter(key)   -> seconds to wait, or 0 if allowed to try
//   limiter.fail(key)         -> record a failed attempt
//   limiter.reset(key)        -> forget the failures (after a success)
export const createFailureLimiter = ({ maxFailures, windowMs }) => {
  const entries = new Map(); // key -> { count, resetAt }

  const prune = (now) => {
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) {
        entries.delete(key);
      }
    }
  };

  return {
    retryAfter(key, now = Date.now()) {
      const entry = entries.get(key);

      if (!entry || entry.resetAt <= now || entry.count < maxFailures) {
        return 0;
      }

      return Math.ceil((entry.resetAt - now) / 1000);
    },

    fail(key, now = Date.now()) {
      // Keep the table small if many different keys fail
      if (entries.size > 5000) {
        prune(now);
      }

      const entry = entries.get(key);

      if (!entry || entry.resetAt <= now) {
        entries.set(key, { count: 1, resetAt: now + windowMs });
      } else {
        entry.count += 1;
      }
    },

    reset(key) {
      entries.delete(key);
    },
  };
};