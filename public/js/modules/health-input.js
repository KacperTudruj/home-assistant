const number = value => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value);
export const kg = value => `${number(value)} kg`;
export const km = value => `${number(value)} km`;
export const dateLabel = value => new Date(`${value}T12:00:00`).toLocaleDateString('pl-PL');
export const todayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};
export const parsePositive = value => {
    const trimmed = value.trim();
    if (!/^\d+(?:[,.]\d{1,2})?$/.test(trimmed)) return null;
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
export const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
    && value <= todayKey();
