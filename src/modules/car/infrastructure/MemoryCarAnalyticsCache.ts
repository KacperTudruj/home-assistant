import { CarAnalyticsCache } from '../domain/CarAnalyticsCache';
import { AnalyticsBusyError } from '../domain/repository/CarAnalyticsRepository';

interface Entry { carId: string; json: string; expires: number; bytes: number }
interface Pending<T> { carId: string; valid: boolean; promise: Promise<T> }

export class MemoryCarAnalyticsCache<T> implements CarAnalyticsCache<T> {
    private readonly entries = new Map<string, Entry>();
    private readonly pending = new Map<string, Pending<T>>();
    private active = 0;
    private bytes = 0;

    constructor(
        private readonly now: () => number = Date.now,
        private readonly limits = { ttlMs: 300000, entries: 100, bytes: 20 * 1024 * 1024, pending: 100 },
    ) {}

    async getOrLoad(carId: string, key: string, load: () => Promise<T>): Promise<T> {
        const cacheKey = JSON.stringify([carId, key]);
        for (const [id, entry] of this.entries) if (entry.expires <= this.now()) this.remove(id);
        const cached = this.entries.get(cacheKey);
        if (cached) {
            this.entries.delete(cacheKey);
            this.entries.set(cacheKey, cached);
            return JSON.parse(cached.json) as T;
        }
        const running = this.pending.get(cacheKey);
        if (running) return structuredClone(await running.promise);
        if (this.active >= this.limits.pending) throw new AnalyticsBusyError('Zbyt wiele obliczeń. Spróbuj ponownie później.');
        this.active++;
        const job: Pending<T> = { carId, valid: true, promise: undefined! };
        job.promise = Promise.resolve().then(load).then(value => {
            if (job.valid) {
                const json = JSON.stringify(value);
                const bytes = Buffer.byteLength(json, 'utf8');
                if (bytes <= this.limits.bytes) {
                    while (this.entries.size && (this.entries.size >= this.limits.entries || this.bytes + bytes > this.limits.bytes)) {
                        this.remove(this.entries.keys().next().value!);
                    }
                    if (this.limits.entries > 0) {
                        this.entries.set(cacheKey, { carId, json, bytes, expires: this.now() + this.limits.ttlMs });
                        this.bytes += bytes;
                    }
                }
            }
            return value;
        }).finally(() => {
            this.active--;
            if (this.pending.get(cacheKey) === job) this.pending.delete(cacheKey);
        });
        this.pending.set(cacheKey, job);
        return structuredClone(await job.promise);
    }

    invalidate(carId: string): void {
        for (const [key, entry] of this.entries) if (entry.carId === carId) this.remove(key);
        for (const [key, job] of this.pending) {
            if (job.carId === carId) {
                job.valid = false;
                this.pending.delete(key);
            }
        }
    }

    private remove(key: string): void {
        const entry = this.entries.get(key);
        if (entry) this.bytes -= entry.bytes;
        this.entries.delete(key);
    }
}
