export interface WeightEntry {
    id: string;
    date: string;
    kg: number;
    note: string;
}

export interface DistanceEntry {
    id: string;
    date: string;
    km: number;
    note: string;
}

export interface HealthState {
    goalKg: number | null;
    pathId: string;
    weights: WeightEntry[];
    distances: DistanceEntry[];
}

export interface WeightInput { date: string; kg: number; note: string; }
export interface DistanceInput { date: string; km: number; note: string; }

export interface HealthRepository {
    getState(): Promise<HealthState>;
    setGoal(kg: number): Promise<void>;
    setPath(id: string): Promise<void>;
    saveWeight(id: string | null, input: WeightInput, replaceExisting: boolean): Promise<boolean>;
    deleteWeight(id: string): Promise<boolean>;
    createDistance(input: DistanceInput): Promise<void>;
    updateDistance(id: string, input: DistanceInput): Promise<boolean>;
    deleteDistance(id: string): Promise<boolean>;
}

export class HealthError extends Error {
    constructor(public readonly code: 'INVALID' | 'NOT_FOUND' | 'CONFLICT', message: string) {
        super(message);
    }
}
