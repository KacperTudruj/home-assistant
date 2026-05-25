import { SmartHomeDevice, SmartHomeProvider, SmartHomeDeviceType } from "../domain/SmartHomeDevice";
import { PrismaClient } from "@prisma/client";

export class Go2RtcSmartHomeAdapter implements SmartHomeProvider {
    constructor(private readonly prisma: PrismaClient) {}

    async getDevices(): Promise<SmartHomeDevice[]> {
        const cameras = await this.prisma.smartHomeCamera.findMany();

        return cameras.map(c => ({
            id: c.id,
            name: c.name,
            label: c.label,
            type: SmartHomeDeviceType.CAMERA
        }));
    }

    async updateCameraLabel(id: string, label: string): Promise<void> {
        await this.prisma.smartHomeCamera.update({
            where: { id },
            data: { label }
        });
    }
}
