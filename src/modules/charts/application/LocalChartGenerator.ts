import { ChartDocument, ChartGenerator, CHART_LIMITS, InvalidChartError } from '../domain/ChartGenerator';

function check(condition: boolean, message: string): asserts condition {
    if (!condition) throw new InvalidChartError(message);
}

function object(value: unknown, keys: string[]): Record<string, unknown> {
    check(value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype,
        'Expected a plain object');
    const result = value as Record<string, unknown>;
    check(Reflect.ownKeys(result).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(result, key)),
        'Unexpected or missing fields');
    check(keys.every(key => 'value' in Object.getOwnPropertyDescriptor(result, key)!), 'Accessors are not supported');
    return result;
}

function text(value: unknown, allowEmpty = false): void {
    check(typeof value === 'string' && value.length <= 500 && (allowEmpty || value.trim().length > 0),
        'Expected text of at most 500 characters');
}

function number(value: unknown): void {
    check(typeof value === 'number' && Number.isFinite(value), 'Expected a finite number');
}

function list(value: unknown, limit: number): unknown[] {
    check(Array.isArray(value) && value.length <= limit, `Expected at most ${limit} items`);
    check(Reflect.ownKeys(value).length === value.length + 1, 'Expected a dense array without extra fields');
    for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        check(descriptor !== undefined && 'value' in descriptor, 'Expected array values');
    }
    return value;
}

function unique(items: unknown[], read: (item: unknown) => string): void {
    const ids = items.map(read);
    check(new Set(ids).size === ids.length, 'IDs must be unique within their collection');
}

export class LocalChartGenerator implements ChartGenerator {
    async generate(request: ChartDocument): Promise<ChartDocument> {
        const document = object(request, ['version', 'charts']);
        check(document.version === 1, 'Unsupported chart contract version');
        unique(list(document.charts, CHART_LIMITS.charts), value => {
            const chart = object(value, ['id', 'type', 'title', 'description', 'xAxis', 'yAxis', 'series', 'referenceLines']);
            text(chart.id); text(chart.title); text(chart.description, true);
            check(chart.type === 'line', 'Unsupported chart type');
            const x = object(chart.xAxis, ['type', 'label']);
            check(x.type === 'date', 'Unsupported X axis');
            text(x.label);
            const y = object(chart.yAxis, ['label', 'unit']);
            text(y.label); text(y.unit);
            unique(list(chart.series, CHART_LIMITS.series), value => {
                const series = object(value, ['id', 'label', 'points']);
                text(series.id); text(series.label);
                let previousDate = '';
                unique(list(series.points, CHART_LIMITS.points), value => {
                    const point = object(value, ['id', 'x', 'y', 'details']);
                    text(point.id);
                    check(typeof point.x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(point.x) && !point.x.startsWith('0000'), 'Invalid point date');
                    const date = new Date(`${point.x}T00:00:00.000Z`);
                    check(Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === point.x, 'Invalid point date');
                    check(point.x >= previousDate, 'Points must be chronological');
                    previousDate = point.x;
                    if (point.y !== null) number(point.y);
                    for (const value of list(point.details, CHART_LIMITS.details)) {
                        const detail = object(value, ['label', 'value', 'unit']);
                        text(detail.label); number(detail.value); text(detail.unit);
                    }
                    return point.id as string;
                });
                return series.id as string;
            });
            for (const value of list(chart.referenceLines, CHART_LIMITS.referenceLines)) {
                const line = object(value, ['value', 'label']);
                number(line.value); text(line.label);
            }
            return chart.id as string;
        });
        // Detach the result from caller-owned data and preserve the future HTTP boundary.
        return JSON.parse(JSON.stringify(request)) as ChartDocument;
    }
}
