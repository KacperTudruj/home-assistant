import { createHealthMocks, paths } from './health-mocks.js';

const STORAGE_KEY = 'tudruj-health-demo-v1';
const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

// Replace this repository with an API implementation when persistence is added.
export class HealthRepository {
    constructor(storage = localStorage) { this.storage = storage; }

    getState() {
        const saved = this.storage.getItem(STORAGE_KEY);
        if (!saved) return createHealthMocks();
        const state = JSON.parse(saved);
        if (!state || !Array.isArray(state.weights) || !Array.isArray(state.distances)
            || !paths.some(path => path.id === state.pathId) || !(state.goalKg > 0)) {
            throw new Error('Nie można odczytać zapisanych danych demonstracyjnych.');
        }
        return state;
    }

    update(change) {
        const state = this.getState();
        change(state);
        this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
        return state;
    }

    setGoal(kg) { return this.update(state => { state.goalKg = kg; }); }
    saveWeight(entry) {
        return this.update(state => {
            state.weights = state.weights.filter(item => item.id !== entry.id && item.date !== entry.date);
            state.weights.push({ ...entry, id: entry.id || newId() });
        });
    }
    deleteWeight(id) { return this.update(state => { state.weights = state.weights.filter(item => item.id !== id); }); }
    saveDistance(entry) {
        return this.update(state => {
            state.distances = state.distances.filter(item => item.id !== entry.id);
            state.distances.push({ ...entry, id: entry.id || newId() });
        });
    }
    deleteDistance(id) { return this.update(state => { state.distances = state.distances.filter(item => item.id !== id); }); }
    choosePath(id) {
        if (!paths.some(path => path.id === id)) throw new Error('Nieznana ścieżka.');
        return this.update(state => { state.pathId = id; });
    }
    reset() {
        const state = createHealthMocks();
        this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
        return state;
    }
}
