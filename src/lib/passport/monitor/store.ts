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
 */
import fs from "node:fs";
import path from "node:path";
import { sha256 } from "./fingerprint";

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
  status: "running" | "completed" | "failed" | "skipped-locked";
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

  async getState(id: string) { return this.load().states[id]; }
  async putState(state: SourceMonitorState) {
    const d = this.load();
    d.states[state.sourceId] = { ...state, errors: state.errors.slice(-20) };
    this.save(d);
  }
  async putSnapshot(text: string) {
    const h = sha256(text);
    if (this.readSnapshot(h) === undefined) this.writeSnapshot(h, text);
    return h;
  }
  async getSnapshot(hash: string) { return this.readSnapshot(hash); }
  async openReviewItem(input: Omit<ReviewItem, "id" | "status">) {
    const d = this.load();
    const existing = d.items.find((i) => i.status === "open" && i.dedupeKey === input.dedupeKey);
    if (existing) return { item: existing, created: false };
    const item: ReviewItem = { ...input, id: `RI-${String(d.items.length + 1).padStart(5, "0")}`, status: "open" };
    d.items.push(item);
    this.save(d);
    return { item, created: true };
  }
  async listReviewItems(filter: { status?: ReviewItem["status"]; sourceId?: string } = {}) {
    return this.load().items.filter((i) => (!filter.status || i.status === filter.status) && (!filter.sourceId || i.sourceId === filter.sourceId));
  }
  async appendAudit(entry: AuditInput) {
    const log = this.loadAudit();
    const prevHash = log.at(-1)?.hash ?? GENESIS_HASH;
    const seq = log.length + 1;
    const rec: AuditRecord = { ...entry, seq, prevHash, hash: auditHash(prevHash, { ...entry, seq }) };
    this.appendAuditRecord(rec);
    return rec;
  }
  async readAudit() { return this.loadAudit(); }
  async acquireLock(name: string, owner: string, nowMs: number, ttlMs: number) {
    const d = this.load();
    const cur = d.locks[name];
    if (cur && cur.expiresAt > nowMs && cur.owner !== owner) return false;
    d.locks[name] = { owner, expiresAt: nowMs + ttlMs };
    this.save(d);
    return true;
  }
  async releaseLock(name: string, owner: string) {
    const d = this.load();
    if (d.locks[name]?.owner === owner) delete d.locks[name];
    this.save(d);
  }
  async saveRun(run: MonitorRun) {
    const d = this.load();
    const i = d.runs.findIndex((r) => r.id === run.id);
    if (i >= 0) d.runs[i] = run; else d.runs.push(run);
    this.save(d);
  }
  async listRuns() { return this.load().runs; }
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

/**
 * Directory layout: state.json (states, items, runs, locks), audit.jsonl (append-only), snapshots/<sha256>.txt.
 * Single-writer by design: the lease lock serialises runs. Writes go to a temp file and are renamed.
 */
export class FileStore extends BaseStore {
  constructor(private dir: string) {
    super();
    fs.mkdirSync(path.join(dir, "snapshots"), { recursive: true });
  }
  private get statePath() { return path.join(this.dir, "state.json"); }
  private get auditPath() { return path.join(this.dir, "audit.jsonl"); }
  protected load(): Data {
    return fs.existsSync(this.statePath) ? { ...empty(), ...JSON.parse(fs.readFileSync(this.statePath, "utf8")) } : empty();
  }
  protected save(d: Data) {
    const tmp = `${this.statePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(d, null, 1) + "\n");
    fs.renameSync(tmp, this.statePath);
  }
  protected loadAudit(): AuditRecord[] {
    if (!fs.existsSync(this.auditPath)) return [];
    return fs.readFileSync(this.auditPath, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  }
  protected appendAuditRecord(r: AuditRecord) { fs.appendFileSync(this.auditPath, JSON.stringify(r) + "\n"); }
  protected writeSnapshot(h: string, t: string) { fs.writeFileSync(path.join(this.dir, "snapshots", `${h}.txt`), t); }
  protected readSnapshot(h: string) {
    if (!/^[0-9a-f]{64}$/.test(h)) return undefined;
    const p = path.join(this.dir, "snapshots", `${h}.txt`);
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : undefined;
  }
}
