import { PrismaClient } from "@prisma/client";
import { FuelStatisticsResponse } from "../interface/dto/FuelStatisticsResponse";

export class GetFuelStatisticsUseCase {
    constructor(private readonly prisma: PrismaClient) {}

    async execute(carId: string): Promise<FuelStatisticsResponse> {
        const fuels = await this.prisma.fuelRecord.findMany({
            where: { carId },
            orderBy: { date: "asc" },
        });

        if (fuels.length === 0) {
            return {
                avgPricePerLiterPerYear: [],
                totalSpentPerYear: [],
                overallAvgConsumptionPer100Km: null,
                overallAvgCostPer100Km: null,
                overallTotalSpent: 0,
                overallTotalLiters: 0,
                overallAvgPricePerLiter: 0,
                overallAvgLitersPerRefuel: 0,
            };
        }

        const yearAgg = this.aggregateByYear(fuels);
        const consumptionStats = this.calculateOverallConsumption(fuels);
        
        const totalLitersAll = fuels.reduce((acc, f) => acc + (f.liters || 0), 0);
        const totalSpentAll = fuels.reduce((acc, f) => acc + (f.totalPrice || 0), 0);

        return {
            avgPricePerLiterPerYear: this.mapToAvgPricePerYear(yearAgg),
            totalSpentPerYear: this.mapToTotalSpentPerYear(yearAgg),
            overallAvgConsumptionPer100Km: consumptionStats.avgConsumption,
            overallAvgCostPer100Km: consumptionStats.avgCost,
            overallTotalSpent: Number(totalSpentAll.toFixed(2)),
            overallTotalLiters: Number(totalLitersAll.toFixed(2)),
            overallAvgPricePerLiter: totalLitersAll > 0 ? Number((totalSpentAll / totalLitersAll).toFixed(2)) : 0,
            overallAvgLitersPerRefuel: fuels.length > 0 ? Number((totalLitersAll / fuels.length).toFixed(2)) : 0,
        };
    }

    private aggregateByYear(fuels: any[]) {
        const yearAgg = new Map<number, { liters: number; totalPrice: number }>();

        for (const f of fuels) {
            const year = f.date.getFullYear();
            const entry = yearAgg.get(year) || { liters: 0, totalPrice: 0 };
            entry.liters += (f.liters || 0);
            entry.totalPrice += (f.totalPrice || 0);
            yearAgg.set(year, entry);
        }
        return yearAgg;
    }

    private calculateOverallConsumption(fuels: any[]) {
        let prev: any = null;
        let distSum = 0;
        let litersSum = 0;
        let totalPriceSum = 0;

        for (const curr of fuels) {
            let distance = 0;

            if (curr.tripDistance && curr.tripDistance > 0) {
                // Preferujemy dystans z licznika dziennego (trip), jeśli jest dostępny
                distance = curr.tripDistance;
            } else if (prev && prev.mileageAtRefuelKm != null && curr.mileageAtRefuelKm != null) {
                // W przeciwnym razie liczmy różnicę z licznika całkowitego
                const diff = curr.mileageAtRefuelKm - prev.mileageAtRefuelKm;
                if (diff > 0) {
                    distance = diff;
                }
            }

            if (distance > 0) {
                // Pomijamy nierealistycznie wielkie dystanse, które sugerują błąd w danych 
                // (np. różnica między 0 a aktualnym przebiegiem przy pierwszym tankowaniu)
                if (distance < 10000) {
                    distSum += distance;
                    litersSum += curr.liters || 0;
                    totalPriceSum += curr.totalPrice || 0;
                }
            }
            prev = curr;
        }

        return {
            avgConsumption: distSum > 0 ? Number(((litersSum / distSum) * 100).toFixed(2)) : null,
            avgCost: distSum > 0 ? Number(((totalPriceSum / distSum) * 100).toFixed(2)) : null,
        };
    }

    private mapToAvgPricePerYear(yearAgg: Map<number, { liters: number; totalPrice: number }>) {
        return Array.from(yearAgg.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([year, { liters, totalPrice }]) => ({
                year,
                avgPricePerLiter: liters > 0 ? Number((totalPrice / liters).toFixed(2)) : 0,
            }));
    }

    private mapToTotalSpentPerYear(yearAgg: Map<number, { totalPrice: number }>) {
        return Array.from(yearAgg.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([year, { totalPrice }]) => ({
                year,
                totalSpent: Number(totalPrice.toFixed(2)),
            }));
    }
}
