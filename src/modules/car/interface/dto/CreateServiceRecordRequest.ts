export interface CreateServiceRecordRequest {
    description: string;
    cost: number;
    mileageKm: number;
    date: string;
    isOilChange?: boolean;
    workshopName?: string | null;
    workshopAddress?: string | null;
}
