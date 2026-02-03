import { FuelRecord } from './FuelRecord';
import { MileageRecord } from './MileageRecord';
import { ServiceRecord } from './ServiceRecord';

export class Car {
    readonly id: string;
    readonly name: string;
    readonly year: number;
    readonly isActive: boolean;
    readonly soldAt?: Date;
    readonly engine?: string;
    readonly vin?: string;
    readonly mileageAtPurchase?: number;

    private mileageRecords: MileageRecord[] = [];
    private fuelRecords: FuelRecord[] = [];
    private serviceRecords: ServiceRecord[] = [];

    constructor(params: {
        id: string;
        name: string;
        year: number;
        isActive: boolean;
        soldAt?: Date;
        engine?: string;
        vin?: string;
        mileageAtPurchase?: number;
    }) {
        this.id = params.id;
        this.name = params.name;
        this.year = params.year;
        this.isActive = params.isActive;
        this.soldAt = params.soldAt;
        this.engine = params.engine;
        this.vin = params.vin;
        this.mileageAtPurchase = params.mileageAtPurchase;
    }

    // ===== MILEAGE =====

    addMileageRecord(record: MileageRecord): void {
        const last = this.getLatestMileage();

        if (last && record.mileageKm < last.mileageKm) {
            throw new Error('Mileage cannot decrease');
        }

        this.mileageRecords.push(record);
    }

    getLatestMileage(): { mileageKm: number; date: Date } | undefined {
        const allReadings: { mileageKm: number; date: Date }[] = [
            ...this.mileageRecords.map(r => ({ mileageKm: r.mileageKm, date: r.date })),
            ...this.fuelRecords
                .filter(r => r.mileageAtRefuelKm !== null)
                .map(r => ({ mileageKm: r.mileageAtRefuelKm!, date: r.date })),
            ...this.serviceRecords.map(r => ({ mileageKm: r.mileageKm, date: r.date }))
        ];

        if (allReadings.length === 0) {
            return undefined;
        }

        return allReadings
            .sort((a, b) => b.mileageKm - a.mileageKm)[0];
    }

    // ===== FUEL =====

    addFuelRecord(record: FuelRecord): void {
        const lastMileage = this.getLatestMileage();

        if (lastMileage && record.mileageAtRefuelKm !== null && record.mileageAtRefuelKm < lastMileage.mileageKm) {
            throw new Error('Fuel record mileage is lower than latest mileage');
        }

        this.fuelRecords.push(record);
    }

    // ===== SERVICE =====

    addServiceRecord(record: ServiceRecord): void {
        this.serviceRecords.push(record);
    }

    // ===== ANALYSIS =====

    calculateAverageFuelConsumption(): {
        averageConsumption?: number;
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        missingMileageKm?: number;
    } {
        const validRecords = this.fuelRecords
            .filter(r => r.mileageAtRefuelKm !== null || (r.tripDistance !== undefined && r.tripDistance !== null))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (validRecords.length < 2) {
            return { confidence: 'LOW' };
        }

        let totalLiters = 0;
        let totalDistance = 0;

        // Logic 1: Using tripDistance if available
        const recordsWithTrip = validRecords.filter(r => r.tripDistance !== undefined && r.tripDistance !== null);
        if (recordsWithTrip.length > 0) {
            recordsWithTrip.forEach(r => {
                totalLiters += r.liters;
                totalDistance += r.tripDistance!;
            });
        } else {
            // Logic 2: Fallback to odometer difference
            const sortedByOdo = validRecords
                .filter(r => r.mileageAtRefuelKm !== null)
                .sort((a, b) => a.mileageAtRefuelKm! - b.mileageAtRefuelKm!);

            if (sortedByOdo.length < 2) return { confidence: 'LOW' };

            for (let i = 1; i < sortedByOdo.length; i++) {
                const distance = sortedByOdo[i].mileageAtRefuelKm! - sortedByOdo[i - 1].mileageAtRefuelKm!;
                if (distance <= 0) continue;
                totalDistance += distance;
                totalLiters += sortedByOdo[i].liters;
            }
        }

        if (totalDistance <= 0) {
            return { confidence: 'LOW' };
        }

        const avg = (totalLiters / totalDistance) * 100;

        return {
            averageConsumption: Number(avg.toFixed(2)),
            confidence: totalDistance > 500 ? 'HIGH' : 'MEDIUM',
        };
    }

    getStatistics() {
        const fuel = this.fuelRecords;
        if (fuel.length === 0) return null;

        const totalLiters = fuel.reduce((sum, r) => sum + r.liters, 0);
        const totalCost = fuel.reduce((sum, r) => sum + r.totalPrice, 0);
        const avgPricePerLiter = totalCost / totalLiters;
        const avgLitersPerRefuel = totalLiters / fuel.length;

        // Per year stats
        const yearlyStats: Record<number, { cost: number; distance: number }> = {};
        fuel.forEach(r => {
            const year = r.date.getFullYear();
            if (!yearlyStats[year]) yearlyStats[year] = { cost: 0, distance: 0 };
            yearlyStats[year].cost += r.totalPrice;
            if (r.tripDistance) yearlyStats[year].distance += r.tripDistance;
        });

        // If tripDistance is missing, try to estimate yearly distance from odometer
        Object.keys(yearlyStats).forEach(y => {
            const year = parseInt(y);
            if (yearlyStats[year].distance === 0) {
                const yearRecords = fuel
                    .filter(r => r.date.getFullYear() === year && r.mileageAtRefuelKm !== null)
                    .sort((a, b) => a.date.getTime() - b.date.getTime());
                
                if (yearRecords.length >= 2) {
                    yearlyStats[year].distance = yearRecords[yearRecords.length - 1].mileageAtRefuelKm! - yearRecords[0].mileageAtRefuelKm!;
                }
            }
        });

        return {
            totalCost: Number(totalCost.toFixed(2)),
            totalLiters: Number(totalLiters.toFixed(2)),
            avgPricePerLiter: Number(avgPricePerLiter.toFixed(2)),
            avgLitersPerRefuel: Number(avgLitersPerRefuel.toFixed(2)),
            avgConsumption: this.calculateAverageFuelConsumption().averageConsumption,
            yearlyStats: Object.entries(yearlyStats).map(([year, stats]) => ({
                year: parseInt(year),
                cost: Number(stats.cost.toFixed(2)),
                distance: Number(stats.distance.toFixed(1))
            }))
        };
    }
}
