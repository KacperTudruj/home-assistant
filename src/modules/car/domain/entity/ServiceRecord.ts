export class InvalidServiceLocationError extends Error {}

function optionalLocation(value: string | null | undefined, field: string, maxLength: number): string | null {
    if (value == null) return null;
    if (typeof value !== 'string' || value.length > maxLength) {
        throw new InvalidServiceLocationError(`${field} must be text up to ${maxLength} characters`);
    }
    return value.trim() || null;
}

export class ServiceRecord {
    readonly workshopName: string | null;
    readonly workshopAddress: string | null;
    readonly description: string;
    readonly cost: number;
    readonly mileageKm: number;
    readonly date: Date;
    readonly isOilChange: boolean;

    constructor(params: {
        description: string;
        cost: number;
        mileageKm: number;
        date: Date;
        isOilChange?: boolean;
        workshopName?: string | null;
        workshopAddress?: string | null;
    }) {
        if (params.cost < 0) {
            throw new Error('Service cost cannot be negative');
        }

        this.description = params.description;
        this.cost = params.cost;
        this.mileageKm = params.mileageKm;
        this.date = params.date;
        this.isOilChange = params.isOilChange ?? false;
        this.workshopName = optionalLocation(params.workshopName, 'Workshop name', 200);
        this.workshopAddress = optionalLocation(params.workshopAddress, 'Workshop address', 500);
    }
}
