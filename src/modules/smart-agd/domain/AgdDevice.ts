export interface AgdDevice
{
    id: string; name: string;
    label: string;
    type: 'WASHER' | 'DRYER' | 'REFRIGERATOR' | 'OTHER';
}