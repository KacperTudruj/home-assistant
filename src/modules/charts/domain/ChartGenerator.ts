// Version 1 supports calendar-day line charts. Text is plain text, never HTML.
export interface ChartPoint {
    id: string;
    x: string;
    y: number | null;
    details: { label: string; value: number; unit: string }[];
}

export interface ChartSpec {
    id: string;
    type: 'line';
    title: string;
    description: string;
    xAxis: { type: 'date'; label: string };
    yAxis: { label: string; unit: string };
    series: { id: string; label: string; points: ChartPoint[] }[];
    referenceLines: { value: number; label: string }[];
}

export interface ChartDocument {
    version: 1;
    charts: ChartSpec[];
}

export interface ChartGenerator {
    generate(request: ChartDocument): Promise<ChartDocument>;
}

export class InvalidChartError extends Error {}

export const CHART_LIMITS = { charts: 8, series: 8, points: 1000, details: 8, referenceLines: 8 } as const;
