import { FuelType } from './value-object/FuelType';

export interface AnalyticsFuelRecord {
    id: string;
    date: string; // UTC calendar day; the repository must supply the complete context.
    fuelType: FuelType;
    liters: number;
    totalPrice: number;
    mileageAtRefuelKm: number | null;
    tripDistance: number | null;
}

export interface FuelAnalyticsFilter {
    from: string;
    to: string;
    fuelType: FuelType;
}

export type FuelMetric = 'consumption' | 'costPer100Km' | 'pricePerLiter' | 'improvement';
export type FuelIssue = 'MISSING_DISTANCE' | 'INVALID_DISTANCE' | 'AMBIGUOUS_ORDER' |
    'FUEL_CHANGED' | 'INVALID_LITERS' | 'INVALID_PRICE' | 'INSUFFICIENT_HISTORY' |
    'UNSUPPORTED_FUEL' | 'NON_FINITE_RESULT';

export interface FuelAnalyticsPoint {
    id: string;
    date: string;
    fuelType: FuelType;
    mileageKm: number | null;
    distanceKm: number | null;
    consumption: number | null;
    costPer100Km: number | null;
    pricePerLiter: number | null;
    improvement: number | null;
    issues: { metric: FuelMetric; reason: FuelIssue }[];
}

export interface FuelAnalytics {
    filter: FuelAnalyticsFilter;
    points: FuelAnalyticsPoint[];
    pricePoints: FuelAnalyticsPoint[];
    availableFuelTypes: FuelType[];
    skipped: Record<FuelMetric, number>;
    warnings: ('ESTIMATED_WITHOUT_FULL_TANK_DATA' | 'MULTIPLE_FUELS' | 'ELECTRIC_NOT_SUPPORTED')[];
}

export class InvalidFuelAnalyticsInputError extends Error {}

function validDay(value: string): boolean {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !value.startsWith('0000') &&
        Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) &&
        new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function positive(value: number | null): value is number {
    return value !== null && Number.isFinite(value) && value > 0;
}

function compareText(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

export class FuelAnalyticsCalculator {
    calculate(records: readonly AnalyticsFuelRecord[], filter: FuelAnalyticsFilter): FuelAnalytics {
        if (!validDay(filter.from) || !validDay(filter.to) || filter.from > filter.to ||
            !Object.values(FuelType).includes(filter.fuelType)) {
            throw new InvalidFuelAnalyticsInputError('Invalid date range or fuel type');
        }
        if (records.length > 5000) throw new InvalidFuelAnalyticsInputError('At most 5000 fuel records are allowed');
        const ids = new Set<string>();
        const groups = new Map<string, AnalyticsFuelRecord[]>();
        for (const record of records) {
            if (!record.id || ids.has(record.id) || !validDay(record.date) || !Object.values(FuelType).includes(record.fuelType)) {
                throw new InvalidFuelAnalyticsInputError('Fuel records require unique IDs, valid dates and fuel types');
            }
            ids.add(record.id);
            if (record.date > filter.to) continue;
            const group = groups.get(record.date) ?? [];
            group.push(record);
            groups.set(record.date, group);
        }

        // Sorting an entire ambiguous day by ID is stable, but never evidence of travel order.
        const ordered: { record: AnalyticsFuelRecord; ambiguous: boolean }[] = [];
        for (const day of [...groups.keys()].sort()) {
            const group = groups.get(day)!;
            const ambiguous = group.length > 1 && (
                group.some(record => !positive(record.mileageAtRefuelKm)) ||
                new Set(group.map(record => record.mileageAtRefuelKm)).size !== group.length
            );
            group.sort((a, b) => ambiguous ? compareText(a.id, b.id) :
                (a.mileageAtRefuelKm ?? 0) - (b.mileageAtRefuelKm ?? 0) || compareText(a.id, b.id));
            ordered.push(...group.map(record => ({ record, ambiguous })));
        }

        const history = new Map<FuelType, { liters: number; distance: number }[]>();
        const calculated: FuelAnalyticsPoint[] = [];
        for (let index = 0; index < ordered.length; index++) {
            const { record, ambiguous } = ordered[index];
            const previous = ordered[index - 1];
            const point: FuelAnalyticsPoint = {
                id: record.id, date: record.date, fuelType: record.fuelType,
                mileageKm: positive(record.mileageAtRefuelKm) ? record.mileageAtRefuelKm : null,
                distanceKm: null, consumption: null, costPer100Km: null, pricePerLiter: null,
                improvement: null, issues: [],
            };
            const liquidFuel = record.fuelType !== FuelType.ELECTRIC;
            let distanceIssue: FuelIssue | null = null;
            if (!liquidFuel) distanceIssue = 'UNSUPPORTED_FUEL';
            else if (ambiguous) distanceIssue = 'AMBIGUOUS_ORDER';
            else if (previous && previous.record.fuelType !== record.fuelType) distanceIssue = 'FUEL_CHANGED';
            else if (positive(record.tripDistance)) point.distanceKm = record.tripDistance;
            else if (previous?.ambiguous) distanceIssue = 'AMBIGUOUS_ORDER';
            else if (previous && positive(previous.record.mileageAtRefuelKm) && positive(record.mileageAtRefuelKm)) {
                point.distanceKm = record.mileageAtRefuelKm - previous.record.mileageAtRefuelKm;
            } else distanceIssue = 'MISSING_DISTANCE';

            if (point.distanceKm !== null && (!positive(point.distanceKm) || point.distanceKm >= 10000)) {
                point.distanceKm = null;
                distanceIssue = 'INVALID_DISTANCE';
            }
            const metric = (name: FuelMetric, issue: FuelIssue | null, value: () => number) => {
                if (issue) point.issues.push({ metric: name, reason: issue });
                else {
                    const result = value();
                    if (Number.isFinite(result)) point[name] = result;
                    else point.issues.push({ metric: name, reason: 'NON_FINITE_RESULT' });
                }
            };
            metric('consumption', distanceIssue ?? (!positive(record.liters) ? 'INVALID_LITERS' : null),
                () => record.liters / point.distanceKm! * 100);
            metric('costPer100Km', distanceIssue ?? (!positive(record.totalPrice) ? 'INVALID_PRICE' : null),
                () => record.totalPrice / point.distanceKm! * 100);
            metric('pricePerLiter', !liquidFuel ? 'UNSUPPORTED_FUEL' : !positive(record.liters) ? 'INVALID_LITERS' :
                !positive(record.totalPrice) ? 'INVALID_PRICE' : null, () => record.totalPrice / record.liters);

            const baseline = history.get(record.fuelType) ?? [];
            const consumptionIssue = point.issues.find(issue => issue.metric === 'consumption');
            metric('improvement', consumptionIssue?.reason ?? (baseline.length < 5 ? 'INSUFFICIENT_HISTORY' : null),
                () => baseline.reduce((sum, item) => sum + item.liters, 0) /
                    baseline.reduce((sum, item) => sum + item.distance, 0) * 100 - point.consumption!);
            if (point.consumption !== null) {
                baseline.push({ liters: record.liters, distance: point.distanceKm! });
                history.set(record.fuelType, baseline.slice(-5));
            }
            calculated.push(point);
        }
        const inRange = calculated.filter(point => point.date >= filter.from);
        const points = inRange.filter(point => point.fuelType === filter.fuelType);
        const pricePoints = inRange;
        const availableFuelTypes = [...new Set(ordered.map(item => item.record.fuelType))].sort();
        const warnings: FuelAnalytics['warnings'] = ['ESTIMATED_WITHOUT_FULL_TANK_DATA'];
        if (availableFuelTypes.length > 1) warnings.push('MULTIPLE_FUELS');
        if (availableFuelTypes.includes(FuelType.ELECTRIC)) warnings.push('ELECTRIC_NOT_SUPPORTED');
        return {
            filter: { ...filter }, points, pricePoints, availableFuelTypes, warnings,
            skipped: {
                consumption: points.filter(point => point.consumption === null).length,
                costPer100Km: points.filter(point => point.costPer100Km === null).length,
                improvement: points.filter(point => point.improvement === null).length,
                pricePerLiter: pricePoints.filter(point => point.pricePerLiter === null).length,
            },
        };
    }
}
