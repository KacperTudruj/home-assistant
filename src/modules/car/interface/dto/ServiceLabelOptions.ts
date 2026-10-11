import { SERVICE_LABELS, ServiceLabel } from '../../domain/value-object/ServiceLabel';

const names: Record<ServiceLabel, string> = {
    OIL_CHANGE: 'Wymiana oleju',
    FILTERS: 'Filtry',
    BATTERY: 'Akumulator',
    INSPECTION: 'Przegląd',
    REPAIR: 'Naprawa'
};

export const serviceLabelOptions = SERVICE_LABELS.map(value => ({ value, label: names[value] }));
