import { AgdDevice } from './AgdDevice';

export interface AgdProvider { getAgdDevices(): Promise<AgdDevice[]>; }