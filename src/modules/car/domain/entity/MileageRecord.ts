export class MileageRecord {
    readonly mileageKm: number;
    readonly date: Date;

    constructor(params: {
        mileageKm: number;
        date: Date;
    }) {
        if (params.mileageKm < 0) {
            throw new Error('Mileage cannot be negative');
        }

        this.mileageKm = params.mileageKm;
        this.date = params.date;
    }
}
