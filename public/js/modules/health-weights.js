import { renderAppNav } from './navigation.js';
import { HealthRepository } from './health-repository.js';
import { ordered } from './health-calculations.js';
import { dateLabel, kg, parsePositive, todayKey, validDate } from './health-input.js';

const repository = new HealthRepository();
const get = id => document.getElementById(id);
let state;

function status(message) { get('health-status').textContent = message; }
function formError(message) { get('weight-form').querySelector('.health-form-error').textContent = message; }

function render() {
    const root = get('weight-history'); root.replaceChildren();
    const weights = [...ordered(state.weights)].reverse();
    const count = weights.length;
    const label = count === 1 ? 'wpis' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'wpisy' : 'wpisów';
    get('weight-count').textContent = `${count} ${label}`;
    if (!weights.length) {
        const empty = document.createElement('p'); empty.className = 'health-empty';
        empty.textContent = 'Nie ma jeszcze pomiarów. Zapisz pierwszy pomiar wagi.';
        root.append(empty); return;
    }
    for (const entry of weights) {
        const row = document.createElement('article'); row.className = 'health-entry';
        const main = document.createElement('div'); main.className = 'health-entry-main';
        const value = document.createElement('strong'); value.textContent = kg(entry.kg);
        const date = document.createElement('time'); date.dateTime = entry.date; date.textContent = dateLabel(entry.date);
        main.append(value, date);
        if (entry.note) { const note = document.createElement('p'); note.textContent = entry.note; main.append(note); }
        const actions = document.createElement('div'); actions.className = 'health-entry-actions';
        for (const [action, label] of [['edit', 'Edytuj'], ['delete', 'Usuń']]) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'btn-link';
            button.dataset.action = action; button.dataset.id = entry.id; button.textContent = label;
            button.setAttribute('aria-label', `${label} pomiar z ${dateLabel(entry.date)}`);
            actions.append(button);
        }
        row.append(main, actions); root.append(row);
    }
}

function openForm(entry = null) {
    const form = get('weight-form'); form.reset(); formError('');
    form.elements.namedItem('id').value = entry?.id || '';
    form.elements.namedItem('value').value = entry ? String(entry.kg).replace('.', ',') : '';
    form.elements.namedItem('date').value = entry?.date || todayKey();
    form.elements.namedItem('date').max = todayKey();
    form.elements.namedItem('note').value = entry?.note || '';
    get('weight-dialog-title').textContent = entry ? 'Edytuj wagę' : 'Zapisz wagę';
    get('weight-dialog').showModal(); form.elements.namedItem('value').focus();
}

async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = form.elements.namedItem('id').value || undefined;
    const value = parsePositive(form.elements.namedItem('value').value);
    const date = form.elements.namedItem('date').value;
    const note = form.elements.namedItem('note').value.trim();
    if (value === null) { formError('Wpisz dodatnią liczbę z maksymalnie dwoma miejscami po przecinku.'); return; }
    if (!validDate(date)) { formError('Wybierz poprawną datę, nie późniejszą niż dzisiaj.'); return; }
    const existing = state.weights.find(item => item.date === date && item.id !== id);
    if (existing && !confirm(`Pomiar z ${dateLabel(date)} już istnieje. Czy zaktualizować go nową wagą?`)) return;
    try {
        await repository.saveWeight({ id, date, kg: value, note }, Boolean(existing));
        state = await repository.getState(); render();
        get('weight-dialog').close(); status('Pomiar wagi zapisany.');
    } catch (error) { formError(error.message || 'Nie udało się zapisać pomiaru.'); }
}

async function onHistoryClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const entry = state.weights.find(item => item.id === button.dataset.id);
    if (!entry) return;
    if (button.dataset.action === 'edit') { openForm(entry); return; }
    if (!confirm(`Usunąć pomiar wagi z ${dateLabel(entry.date)}?`)) return;
    try {
        await repository.deleteWeight(entry.id);
        state = await repository.getState(); render(); status('Pomiar wagi usunięty.');
    } catch (error) { status(error.message || 'Nie udało się usunąć pomiaru.'); }
}

async function load() {
    get('add-weight').disabled = true;
    try { state = await repository.getState(); render(); status(''); get('add-weight').disabled = false; }
    catch (error) { state = undefined; status(error.message || 'Nie udało się wczytać pomiarów.'); }
}

function init() {
    renderAppNav();
    get('add-weight').addEventListener('click', () => openForm());
    get('weight-form').addEventListener('submit', save);
    get('weight-history').addEventListener('click', onHistoryClick);
    document.querySelector('[data-close]').addEventListener('click', () => get('weight-dialog').close());
    window.addEventListener('pageshow', event => { if (event.persisted) load(); });
    status('Ładowanie pomiarów…'); load();
}

document.addEventListener('DOMContentLoaded', init);
