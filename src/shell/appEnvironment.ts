/**
 * Which deployment the browser is talking to, derived from the host it loaded from.
 *
 * The host is the only signal available: one image is built without environment-specific
 * build args and promoted from staging to production unchanged (see the app Dockerfiles),
 * so nothing about the environment is baked into the bundle. Canonical hosts carry it
 * instead — `plm.staging.zabriskie-point.ae` vs `plm.zabriskie-point.ae`.
 *
 * Production is the fallback, never a match: a host we cannot place must not be labelled a
 * test environment, because telling real users their data is disposable is worse than
 * leaving a banner off a non-canonical staging URL.
 */

/** Which deployment the browser is talking to. */
export type AppEnvironment = "production" | "staging" | "development";

const LOOPBACK_HOSTS = new Set(["::1", "[::1]", "0.0.0.0"]);

/** RFC 1918 ranges (plus loopback) — a dev server reached from a phone on the same wifi. */
const PRIVATE_IPV4 =
  /^(?:10\.\d{1,3}|127\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}$/;

/** Labels a host uses to name a non-production environment. */
const STAGING_LABELS = new Set(["staging", "stg"]);
// `localhost` as a label, not just the whole host: the dev stack is served from
// `plm.localhost` behind the Caddy proxy.
const DEVELOPMENT_LABELS = new Set([
  "localhost",
  "local",
  "dev",
  "develop",
  "development",
]);

export function resolveAppEnvironment(hostname: string): AppEnvironment {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (LOOPBACK_HOSTS.has(host) || PRIVATE_IPV4.test(host)) return "development";

  const labels = host.split(".");
  // A single label is a machine name on the LAN (`macbook`, `plm`), never a public host.
  if (labels.length === 1) return "development";
  if (labels.some((label) => STAGING_LABELS.has(label))) return "staging";
  if (labels.some((label) => DEVELOPMENT_LABELS.has(label))) return "development";

  return "production";
}

/** True on every environment except production — i.e. wherever data is disposable. */
export function isTestEnvironment(hostname = window.location.hostname): boolean {
  return resolveAppEnvironment(hostname) !== "production";
}
