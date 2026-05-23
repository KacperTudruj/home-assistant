export interface CreateServiceRecordRequest {
    description: string;
    cost: number;
    mileageKm: number;
    date: string;
    isOilChange?: boolean;
}
