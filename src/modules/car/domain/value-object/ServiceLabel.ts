export const SERVICE_LABELS = ['OIL_CHANGE', 'FILTERS', 'BATTERY', 'INSPECTION', 'REPAIR'] as const;
export type ServiceLabel = typeof SERVICE_LABELS[number];

export class InvalidServiceLabelError extends Error {}

export function parseServiceLabel(value: unknown): ServiceLabel | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string' || !SERVICE_LABELS.includes(value as ServiceLabel)) {
        throw new InvalidServiceLabelError('Unsupported service label');
    }
    return value as ServiceLabel;
}
