import { AgdProvider } from '../domain/AgdProvider';
import { AgdDevice } from '../domain/AgdDevice';
import { SmartThingsClient } from '../../../shared/connectors/smartthings/domain/SmartThingsClient';

export class SmartThingsAgdAdapter implements AgdProvider {
    constructor(private readonly stClient: SmartThingsClient) {}

    async getAgdDevices(): Promise<AgdDevice[]> {
        const allDevices = await this.stClient.getDevices();
        
        return allDevices
            .filter(d => {
                const searchString = (d.label + ' ' + d.name).toLowerCase();
                return searchString.includes('washer') || 
                       searchString.includes('dryer') || 
                       searchString.includes('refrigerator') ||
                       searchString.includes('fridge') ||
                       searchString.includes('pralka') ||
                       searchString.includes('suszarka') ||
                       searchString.includes('lodówka');
            })
            .map(d => {
                const searchString = (d.label + ' ' + d.name).toLowerCase();
                let type: AgdDevice['type'] = 'OTHER';
                
                if (searchString.includes('washer') || searchString.includes('pralka')) type = 'WASHER';
                else if (searchString.includes('dryer') || searchString.includes('suszarka')) type = 'DRYER';
                else if (searchString.includes('refrigerator') || searchString.includes('fridge') || searchString.includes('lodówka')) type = 'REFRIGERATOR';
                
                return {
                    id: d.id,
                    name: d.name,
                    label: d.label,
                    type: type
                };
            });
    }
}
