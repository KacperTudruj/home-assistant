import { ChartGenerator, ChartPoint, ChartSpec } from '../../charts/domain/ChartGenerator';
import { AnalyticsFuelRecord, FuelAnalyticsCalculator, FuelAnalyticsFilter, FuelAnalyticsPoint, FuelMetric } from '../domain/FuelAnalyticsCalculator';

export class GenerateFuelChartsUseCase {
    constructor(
        private readonly generator: ChartGenerator,
        private readonly calculator = new FuelAnalyticsCalculator(),
    ) {}

    async execute(records: readonly AnalyticsFuelRecord[], filter: FuelAnalyticsFilter) {
        const analytics = this.calculator.calculate(records, filter);
        const point = (record: FuelAnalyticsPoint, metric: FuelMetric): ChartPoint => ({
            id: record.id, x: record.date, y: record[metric],
            details: [
                ...(record.distanceKm === null ? [] : [{ label: 'Dystans', value: record.distanceKm, unit: 'km' }]),
                ...(record.mileageKm === null ? [] : [{ label: 'Przebieg', value: record.mileageKm, unit: 'km' }]),
            ],
        });
        const chart = (id: FuelMetric, title: string, unit: string, description: string): ChartSpec => ({
            id, type: 'line', title, description,
            xAxis: { type: 'date', label: 'Data tankowania' }, yAxis: { label: title, unit },
            series: [{ id: filter.fuelType, label: filter.fuelType, points: analytics.points.map(record => point(record, id)) }],
            referenceLines: [],
        });
        const consumption = chart('consumption', 'Szacowane spalanie', 'l/100 km',
            'Szacunek bez informacji o tankowaniu do pełna; dolewki mogą zniekształcać wynik.');
        const improvement = chart('improvement', 'Zmiana spalania względem ostatnich tankowań', 'l/100 km',
            'Średnia ważona dystansem poprzednich 5 poprawnych tankowań minus bieżące spalanie. + mniejsze spalanie, − większe spalanie.');
        improvement.referenceLines = [{ value: 0, label: 'Bez zmiany' }];
        const cost = chart('costPer100Km', 'Szacowany koszt paliwa na 100 km', 'zł/100 km',
            'Koszt wybranego paliwa; bez serwisu i innych paliw używanych równolegle.');
        const price = chart('pricePerLiter', 'Cena paliwa przy tankowaniu', 'zł/l', 'Cena całkowita podzielona przez liczbę litrów.');
        price.series = [...new Set(analytics.pricePoints.map(record => record.fuelType))].sort().map(fuelType => ({
            id: fuelType, label: fuelType,
            points: analytics.pricePoints.filter(record => record.fuelType === fuelType).map(record => point(record, 'pricePerLiter')),
        }));
        const document = await this.generator.generate({ version: 1, charts: [consumption, improvement, cost, price] });
        return { document, analytics };
    }
}
