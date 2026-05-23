export class ServiceRecord {
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
    }) {
        if (params.cost < 0) {
            throw new Error('Service cost cannot be negative');
        }

        this.description = params.description;
        this.cost = params.cost;
        this.mileageKm = params.mileageKm;
        this.date = params.date;
        this.isOilChange = params.isOilChange ?? false;
    }
}
