/**
 * Persistence interface for the source monitor, with two implementations:
 * - MemoryStore: tests.
 * - FileStore: a directory of JSON files (for local runs and a future scheduled job that commits its
 *   log). No hosted database is introduced in Phase 2B-A.
 *
 * The audit log is append-only and hash-chained: each record stores the previous record's hash, so
 * any edit or deletion is detectable with verifyAuditChain(). Review items are de-duplicated by key
 * while open, so a repeated run cannot raise the same alert twice. A lease lock prevents overlapping
 * runs.
 *
 * Concurrency (FileStore): every operation runs under an exclusive cross-process mutex (a lock file
 * created with O_CREAT|O_EXCL), so concurrent processes cannot lose updates, interleave audit records
 * or break the hash chain. The store fails closed: if the mutex cannot be acquired in time (including
 * when a crashed process left it behind) the operation throws StoreLockedError; it never breaks
 * someone else's lock. Corrupt state or a broken audit chain throws StoreIntegrityError instead of
 * being silently reset or extended.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { sha256 } from "./fingerprint";

export class StoreLockedError extends Error { code = "ESTORELOCKED"; }
export class StoreIntegrityError extends Error { code = "ESTOREINTEGRITY"; }

export type MonitorErrorEntry = { at: string; kind: string; detail: string };

export type SourceMonitorState = {
  sourceId: string;
  lastCheckedAt?: string;
  /** Last time the source was fetched and read successfully by the monitor. Not Source.checked. */
  lastSuccessAt?: string;
  lastOutcome?: string;
  etag?: string;
  lastModified?: string;
  rawHash?: string;
  textHash?: string;
  finalUrl?: string;
  consecutiveFailures: number;
  /** Most recent errors, newest last, capped at 20. */
  errors: MonitorErrorEntry[];
};

export type ReviewItemKind = "content-changed" | "source-unavailable" | "source-moved-or-removed" | "manual-check-required" | "extraction-failed" | "marker-missing";

export type ReviewItem = {
  id: string;
  kind: ReviewItemKind;
  status: "open" | "resolved" | "dismissed";
  dedupeKey: string;
  sourceId: string;
  sourceUrl: string;
  createdAt: string;
  priority: "high" | "normal" | "low";
  detail: string;
  ruleIds: string[];
  signals: string[];
  beforeHash?: string;
  afterHash?: string;
  /** Changed lines, bounded, as evidence for the reviewer. Always read the official source itself. */
  removedLines?: string[];
  addedLines?: string[];
};

export type AuditInput = { at: string; actor: string; action: string; subject: string; detail: string };
export type AuditRecord = AuditInput & { seq: number; prevHash: string; hash: string };

export type MonitorRun = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed" | "skipped-locked" | "refused-invalid-config";
  due: number;
  checked: number;
  unchanged: number;
  cosmetic: number;
  changed: number;
  baselines: number;
  failed: number;
  itemsCreated: number;
  error?: string;
};

export interface MonitorStore {
  getState(sourceId: string): Promise<SourceMonitorState | undefined>;
  putState(state: SourceMonitorState): Promise<void>;
  putSnapshot(text: string): Promise<string>;
  getSnapshot(hash: string): Promise<string | undefined>;
  openReviewItem(item: Omit<ReviewItem, "id" | "status">): Promise<{ item: ReviewItem; created: boolean }>;
  listReviewItems(filter?: { status?: ReviewItem["status"]; sourceId?: string }): Promise<ReviewItem[]>;
  appendAudit(entry: AuditInput): Promise<AuditRecord>;
  readAudit(): Promise<AuditRecord[]>;
  acquireLock(name: string, owner: string, nowMs: number, ttlMs: number): Promise<boolean>;
  releaseLock(name: string, owner: string): Promise<void>;
  saveRun(run: MonitorRun): Promise<void>;
  listRuns(): Promise<MonitorRun[]>;
}

export const GENESIS_HASH = "0".repeat(64);
const canonical = (e: AuditInput & { seq: number }) => JSON.stringify([e.seq, e.at, e.actor, e.action, e.subject, e.detail]);
export const auditHash = (prevHash: string, e: AuditInput & { seq: number }) => sha256(prevHash + canonical(e));

export function verifyAuditChain(records: AuditRecord[]): { ok: true } | { ok: false; brokenAt: number; reason: string } {
  let prev = GENESIS_HASH;
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.seq !== i + 1) return { ok: false, brokenAt: i + 1, reason: "sequence gap or reorder" };
    if (r.prevHash !== prev) return { ok: false, brokenAt: r.seq, reason: "previous hash mismatch" };
    if (r.hash !== auditHash(prev, r)) return { ok: false, brokenAt: r.seq, reason: "record altered" };
    prev = r.hash;
  }
  return { ok: true };
}

type Data = { states: Record<string, SourceMonitorState>; items: ReviewItem[]; runs: MonitorRun[]; locks: Record<string, { owner: string; expiresAt: number }> };

abstract class BaseStore implements MonitorStore {
  protected abstract load(): Data;
  protected abstract save(d: Data): void;
  protected abstract loadAudit(): AuditRecord[];
  protected abstract appendAuditRecord(r: AuditRecord): void;
  protected abstract writeSnapshot(hash: string, text: string): void;
  protected abstract readSnapshot(hash: string): string | undefined;
  /** Runs fn under the store's exclusive lock. In-process stores need none. */
  protected exclusive<T>(fn: () => T): T { return fn(); }

  async getState(id: string) { return this.exclusive(() => this.load().states[id]); }
  async putState(state: SourceMonitorState) {
    this.exclusive(() => {
      const d = this.load();
      d.states[state.sourceId] = { ...state, errors: state.errors.slice(-20) };
      this.save(d);
    });
  }
  async putSnapshot(text: string) {
    const h = sha256(text);
    this.exclusive(() => { if (this.readSnapshot(h) === undefined) this.writeSnapshot(h, text); });
    return h;
  }
  async getSnapshot(hash: string) { return this.exclusive(() => this.readSnapshot(hash)); }
  async openReviewItem(input: Omit<ReviewItem, "id" | "status">) {
    return this.exclusive(() => {
      const d = this.load();
      const existing = d.items.find((i) => i.status === "open" && i.dedupeKey === input.dedupeKey);
      if (existing) return { item: existing, created: false };
      const item: ReviewItem = { ...input, id: `RI-${String(d.items.length + 1).padStart(5, "0")}`, status: "open" };
      d.items.push(item);
      this.save(d);
      return { item, created: true };
    });
  }
  async listReviewItems(filter: { status?: ReviewItem["status"]; sourceId?: string } = {}) {
    return this.exclusive(() => this.load().items.filter((i) => (!filter.status || i.status === filter.status) && (!filter.sourceId || i.sourceId === filter.sourceId)));
  }
  async appendAudit(entry: AuditInput) {
    return this.exclusive(() => {
      const log = this.loadAudit();
      // Fail closed: never extend a chain that has been tampered with.
      const check = verifyAuditChain(log);
      if (!check.ok) throw new StoreIntegrityError(`audit chain broken at record ${check.brokenAt} (${check.reason}); refusing to append`);
      const prevHash = log.at(-1)?.hash ?? GENESIS_HASH;
      const seq = log.length + 1;
      const rec: AuditRecord = { ...entry, seq, prevHash, hash: auditHash(prevHash, { ...entry, seq }) };
      this.appendAuditRecord(rec);
      return rec;
    });
  }
  async readAudit() { return this.exclusive(() => this.loadAudit()); }
  async acquireLock(name: string, owner: string, nowMs: number, ttlMs: number) {
    return this.exclusive(() => {
      const d = this.load();
      const cur = d.locks[name];
      if (cur && cur.expiresAt > nowMs && cur.owner !== owner) return false;
      d.locks[name] = { owner, expiresAt: nowMs + ttlMs };
      this.save(d);
      return true;
    });
  }
  async releaseLock(name: string, owner: string) {
    this.exclusive(() => {
      const d = this.load();
      if (d.locks[name]?.owner === owner) delete d.locks[name];
      this.save(d);
    });
  }
  async saveRun(run: MonitorRun) {
    this.exclusive(() => {
      const d = this.load();
      const i = d.runs.findIndex((r) => r.id === run.id);
      if (i >= 0) d.runs[i] = run; else d.runs.push(run);
      this.save(d);
    });
  }
  async listRuns() { return this.exclusive(() => this.load().runs); }
}

const empty = (): Data => ({ states: {}, items: [], runs: [], locks: {} });

export class MemoryStore extends BaseStore {
  private data = empty();
  private audit: AuditRecord[] = [];
  private snaps = new Map<string, string>();
  protected load() { return structuredClone(this.data); }
  protected save(d: Data) { this.data = structuredClone(d); }
  protected loadAudit() { return [...this.audit]; }
  protected appendAuditRecord(r: AuditRecord) { this.audit.push(r); }
  protected writeSnapshot(h: string, t: string) { this.snaps.set(h, t); }
  protected readSnapshot(h: string) { return this.snaps.get(h); }
  /** Test hook: direct access to the audit array, to prove tampering is detected. */
  unsafeAuditForTests() { return this.audit; }
}

const sleepSync = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

export type FileStoreOptions = { mutexTimeoutMs?: number };

/**
 * Directory layout: state.json (states, items, runs, locks), audit.jsonl (append-only),
 * snapshots/<sha256>.txt, and .store.lock while an operation is in progress.
 * Safe for concurrent processes on one filesystem (local disk; not network filesystems without
 * O_EXCL semantics). State writes are fsynced to a unique temp file and renamed atomically.
 */
export class FileStore extends BaseStore {
  private readonly mutexTimeoutMs: number;
  private depth = 0;
  constructor(private dir: string, opts: FileStoreOptions = {}) {
    super();
    this.mutexTimeoutMs = opts.mutexTimeoutMs ?? 10_000;
    fs.mkdirSync(path.join(dir, "snapshots"), { recursive: true });
  }
  private get statePath() { return path.join(this.dir, "state.json"); }
  private get auditPath() { return path.join(this.dir, "audit.jsonl"); }
  get mutexPath() { return path.join(this.dir, ".store.lock"); }

  protected exclusive<T>(fn: () => T): T {
    if (this.depth > 0) return fn();
    const token = `${os.hostname()}:${process.pid}:${randomUUID()}`;
    const deadline = Date.now() + this.mutexTimeoutMs;
    for (;;) {
      try {
        const fd = fs.openSync(this.mutexPath, "wx", 0o600);
        try { fs.writeSync(fd, JSON.stringify({ token, at: new Date().toISOString() })); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
        break;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
        if (Date.now() >= deadline) {
          throw new StoreLockedError(`monitor store is locked (${this.mutexPath}). Another process is writing, or one crashed while writing. Remove the lock file only after confirming no monitor process is running.`);
        }
        sleepSync(2 + Math.floor(Math.random() * 8));
      }
    }
    this.depth++;
    try {
      return fn();
    } finally {
      this.depth--;
      try {
        const held = JSON.parse(fs.readFileSync(this.mutexPath, "utf8")) as { token?: string };
        if (held.token === token) fs.unlinkSync(this.mutexPath);
      } catch {
        /* lock already gone: nothing to release */
      }
    }
  }

  protected load(): Data {
    if (!fs.existsSync(this.statePath)) return empty();
    try {
      return { ...empty(), ...JSON.parse(fs.readFileSync(this.statePath, "utf8")) };
    } catch (e) {
      throw new StoreIntegrityError(`state.json is unreadable (${e instanceof Error ? e.message : e}); refusing to overwrite it`);
    }
  }
  protected save(d: Data) {
    const tmp = `${this.statePath}.${process.pid}.${randomUUID()}.tmp`;
    const fd = fs.openSync(tmp, "wx", 0o600);
    try { fs.writeSync(fd, JSON.stringify(d, null, 1) + "\n"); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, this.statePath);
  }
  protected loadAudit(): AuditRecord[] {
    if (!fs.existsSync(this.auditPath)) return [];
    const lines = fs.readFileSync(this.auditPath, "utf8").split("\n").filter(Boolean);
    return lines.map((l, i) => {
      try {
        return JSON.parse(l) as AuditRecord;
      } catch {
        throw new StoreIntegrityError(`audit.jsonl line ${i + 1} is not valid JSON`);
      }
    });
  }
  protected appendAuditRecord(r: AuditRecord) {
    const fd = fs.openSync(this.auditPath, "a", 0o600);
    try { fs.writeSync(fd, JSON.stringify(r) + "\n"); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  }
  protected writeSnapshot(h: string, t: string) {
    const p = path.join(this.dir, "snapshots", `${h}.txt`);
    const tmp = `${p}.${randomUUID()}.tmp`;
    fs.writeFileSync(tmp, t, { mode: 0o600 });
    fs.renameSync(tmp, p);
  }
  protected readSnapshot(h: string) {
    if (!/^[0-9a-f]{64}$/.test(h)) return undefined;
    const p = path.join(this.dir, "snapshots", `${h}.txt`);
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : undefined;
  }
}
