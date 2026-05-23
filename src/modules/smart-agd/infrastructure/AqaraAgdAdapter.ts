import { AgdProvider } from '../domain/AgdProvider';
import { AgdDevice } from '../domain/AgdDevice';
import { AqaraClient } from '../../../shared/connectors/aqara/domain/AqaraClient';

export class AqaraAgdAdapter implements AgdProvider {
    constructor(private readonly aqaraClient: AqaraClient) {}

    async getAgdDevices(): Promise<AgdDevice[]> {
        const aqaraDevices = await this.aqaraClient.getDevices();
        
        // Filtrujemy urządzenia, które mogą pasować do modułu AGD (lub po prostu zwracamy czujniki jako inne)
        // Aqara Camera Hub G2H Pro (kamera) i czujnik temp/wilgotności.
        // Czujnik temperatury nie jest typowym AGD, ale w tym projekcie smart-agd wydaje się być głównym hubem dla urządzeń smart.
        
        return aqaraDevices.map(d => {
            let type: AgdDevice['type'] = 'OTHER';
            
            // Mapowanie modeli Aqara na typy AGD (jeśli jakieś są lodówkami/pralkami)
            // Na razie większość to będzie OTHER.
            
            return {
                id: d.id,
                name: d.name,
                label: d.name, // Aqara nie zawsze ma oddzielny label jak SmartThings
                type: type
            };
        });
    }
}
