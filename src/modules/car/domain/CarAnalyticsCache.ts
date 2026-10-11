export interface CarAnalyticsCache<T> {
    getOrLoad(carId: string, key: string, load: () => Promise<T>): Promise<T>;
    invalidate(carId: string): void;
}
