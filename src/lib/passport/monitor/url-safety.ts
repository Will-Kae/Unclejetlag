/**
 * SSRF protection for the source monitor.
 *
 * - Only https URLs on port 443, with a hostname (never an IP literal) and no credentials.
 * - Optionally restricted to an allow-list of hosts (the hosts of registered official sources).
 * - Every DNS answer is checked at connection time (guardedLookup), so a hostname that resolves to a
 *   private, loopback, link-local, multicast or reserved address is refused, including after a
 *   redirect and including DNS-rebinding answers.
 */
import net from "node:net";

export type UrlCheck = { ok: true; url: URL } | { ok: false; reason: string };

export function validateSourceUrl(raw: string, allowedHosts?: ReadonlySet<string>): UrlCheck {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return { ok: false, reason: "url-length" };
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "url-invalid" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "scheme-not-https" };
  if (url.username || url.password) return { ok: false, reason: "credentials-in-url" };
  if (url.port && url.port !== "443") return { ok: false, reason: "non-standard-port" };
  const host = url.hostname.toLowerCase();
  if (!host) return { ok: false, reason: "no-host" };
  if (net.isIP(host.replace(/^\[|\]$/g, ""))) return { ok: false, reason: "ip-literal" };
  if (!host.includes(".") || host.endsWith(".")) return { ok: false, reason: "host-not-fqdn" };
  if (/(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/.test(host)) return { ok: false, reason: "internal-hostname" };
  if (allowedHosts && !allowedHosts.has(host)) return { ok: false, reason: "host-not-allowed" };
  return { ok: true, url };
}

function v4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

const V4_BLOCKED: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
  // Cloud metadata / platform endpoints on otherwise public addresses (169.254.169.254 and
  // 100.100.100.200 are already covered by the link-local and CGNAT ranges above).
  ["168.63.129.16", 32], // Azure WireServer
];

function isBlockedV4(ip: string): boolean {
  const n = v4ToInt(ip);
  return V4_BLOCKED.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (v4ToInt(base) & mask);
  });
}

/** Expand an IPv6 address to eight 16-bit groups. */
function expandV6(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  // Embedded IPv4 tail (e.g. ::ffff:10.0.0.1)
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const n = v4ToInt(v4[1]);
    s = s.slice(0, -v4[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const [head, tail] = s.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined ? (tail ? tail.split(":") : []) : [];
  if (s.includes("::") ? h.length + t.length > 7 : h.length !== 8) return null;
  const groups = [...h, ...Array(8 - h.length - t.length).fill("0"), ...t].map((g) => parseInt(g || "0", 16));
  return groups.some((g) => Number.isNaN(g) || g < 0 || g > 0xffff) ? null : groups;
}

function isBlockedV6(ip: string): boolean {
  const g = expandV6(ip);
  if (!g) return true;
  const embeddedV4 = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  if (g.every((x) => x === 0)) return true; // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
  if (g.slice(0, 6).every((x) => x === 0)) return true; // ::/96 (deprecated IPv4-compatible, e.g. ::127.0.0.1)
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return isBlockedV4(embeddedV4(g[6], g[7])); // IPv4-mapped
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return isBlockedV4(embeddedV4(g[6], g[7])); // NAT64
  if (g[0] === 0x2002) return isBlockedV4(embeddedV4(g[1], g[2])); // 6to4
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
  if (g[0] === 0x0100 && g.slice(1, 4).every((x) => x === 0)) return true; // discard-only
  if (g[0] === 0x2001 && g[1] < 0x0200) return true; // 2001::/23 IETF protocol assignments (incl. Teredo)
  return false;
}

/** True for any address the monitor must never connect to. Unparseable input is blocked. */
export function isBlockedAddress(ip: string): boolean {
  const kind = net.isIP(ip.replace(/^\[|\]$/g, "").split("%")[0]);
  if (kind === 4) return isBlockedV4(ip);
  if (kind === 6) return isBlockedV6(ip);
  return true;
}

export class BlockedAddressError extends Error {
  code = "EBLOCKEDADDRESS";
}

type LookupAll = (hostname: string, options: { all: true }, cb: (err: NodeJS.ErrnoException | null, addresses: { address: string; family: number }[]) => void) => void;

/**
 * A `lookup` function for node:https that refuses blocked addresses. Pass the system resolver
 * (dns.lookup) in production and a fake resolver in tests.
 */
export function guardedLookup(resolve: LookupAll) {
  return (hostname: string, options: object, cb: (err: NodeJS.ErrnoException | null, address?: string | { address: string; family: number }[], family?: number) => void) => {
    resolve(hostname, { all: true }, (err, addresses) => {
      if (err) return cb(err);
      if (!addresses?.length) return cb(new BlockedAddressError(`${hostname}: no addresses`));
      const bad = addresses.find((a) => isBlockedAddress(a.address));
      if (bad) return cb(new BlockedAddressError(`${hostname} resolves to a blocked address`));
      const wantAll = (options as { all?: boolean }).all;
      if (wantAll) return cb(null, addresses);
      return cb(null, addresses[0].address, addresses[0].family);
    });
  };
}
