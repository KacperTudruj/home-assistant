export class HealthRepository {
    async request(path, method = 'GET', data) {
        const response = await fetch(`/api/health${path}`, {
            method,
            cache: 'no-store',
            headers: data ? { 'Content-Type': 'application/json' } : undefined,
            body: data ? JSON.stringify(data) : undefined,
        });
        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.error || 'Nie udało się zapisać danych. Spróbuj ponownie.');
        }
        return response.status === 204 ? undefined : response.json();
    }

    getState() { return this.request('/overview'); }
    setGoal(kg) { return this.request('/goal', 'PUT', { kg }); }
    choosePath(pathId) { return this.request('/path', 'PUT', { pathId }); }
    saveWeight(entry, replaceExisting = false) {
        const path = entry.id ? `/weights/${encodeURIComponent(entry.id)}` : '/weights';
        return this.request(path, entry.id ? 'PUT' : 'POST', {
            date: entry.date, kg: entry.kg, note: entry.note, replaceExisting,
        });
    }
    deleteWeight(id) { return this.request(`/weights/${encodeURIComponent(id)}`, 'DELETE'); }
    saveDistance(entry) {
        const path = entry.id ? `/distances/${encodeURIComponent(entry.id)}` : '/distances';
        return this.request(path, entry.id ? 'PUT' : 'POST', { date: entry.date, km: entry.km, note: entry.note });
    }
    deleteDistance(id) { return this.request(`/distances/${encodeURIComponent(id)}`, 'DELETE'); }
}
