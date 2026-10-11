import { AnalyticsFuelRecord, FuelAnalyticsFilter } from '../FuelAnalyticsCalculator';
import { FuelType } from '../value-object/FuelType';

export interface CarAnalyticsSource {
    car: { id: string; name: string };
    records: AnalyticsFuelRecord[];
    availableFuelTypes: FuelType[];
}

export interface CarAnalyticsRepository {
    read(carId: string, filter: FuelAnalyticsFilter): Promise<CarAnalyticsSource | null>;
}

export class AnalyticsLimitError extends Error {}
export class AnalyticsNotFoundError extends Error {}
export class AnalyticsBusyError extends Error {}
