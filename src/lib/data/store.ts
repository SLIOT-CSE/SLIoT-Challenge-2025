import type {
  AuditEntry,
  Member,
  OutboxEmail,
  Settings,
  ShortlistFinalisation,
  Submission,
  Team,
} from "./types";

// The sample store: everything the data layer knows, held in memory and (in the browser)
// saved to sessionStorage so a refresh keeps the state. Never used in production.

export interface StoreState {
  schemaVersion: 1;
  /** One counter for every record's id */
  nextId: number;
  teams: Team[];
  members: Member[];
  submissions: Submission[];
  settings: Settings;
  finalisations: ShortlistFinalisation[];
  outbox: OutboxEmail[];
  audit: AuditEntry[];
  /** The team logged in with its code */
  session: { teamId: number } | null;
}

/** Where the state is saved between page loads. Kept separate so tests run in plain Node */
export interface Persistence {
  load(): string | null;
  save(json: string): void;
}

export interface StoreOptions {
  seed: () => StoreState;
  persistence?: Persistence;
  /** Pretend network delay for every call, so loading states can be seen. Default 0 */
  latencyMs?: number;
}

export class Store {
  private current: StoreState;
  private listeners = new Set<() => void>();
  private versionNumber = 0;
  readonly latencyMs: number;

  constructor(private readonly options: StoreOptions) {
    this.latencyMs = options.latencyMs ?? 0;
    this.current = this.restore() ?? options.seed();
  }

  private restore(): StoreState | null {
    const json = this.options.persistence?.load();
    if (!json) return null;
    try {
      const parsed = JSON.parse(json) as StoreState;
      return parsed.schemaVersion === 1 ? parsed : null;
    } catch {
      return null;
    }
  }

  get state(): StoreState {
    return this.current;
  }

  /** The sample clock, or the real one */
  now(): number {
    return this.current.settings.now ?? Date.now();
  }

  nextId(): number {
    return this.current.nextId++;
  }

  /** Runs a change, then saves it and tells subscribers. Changes must not throw halfway */
  mutate<T>(change: (state: StoreState) => T): T {
    const result = change(this.current);
    this.options.persistence?.save(JSON.stringify(this.current));
    this.versionNumber++;
    this.listeners.forEach((l) => l());
    return result;
  }

  /** Back to the 20 seeded teams */
  reset(): void {
    this.current = this.options.seed();
    this.mutate(() => undefined);
  }

  /** For `useSyncExternalStore` */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Changes on every mutation, for `useSyncExternalStore` */
  getVersion = (): number => this.versionNumber;
}

const STORAGE_KEY = "sliot-sample-store-v1";

export const sessionStoragePersistence: Persistence = {
  load: () => {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  save: (json) => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, json);
    } catch {
      // storage full or blocked: the store still works for this page load
    }
  },
};
