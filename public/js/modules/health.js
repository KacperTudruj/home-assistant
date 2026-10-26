import { renderAppNav } from './navigation.js';
import { renderCharts } from './chart-renderer.js';
import { HealthRepository } from './health-repository.js';
import { paths } from './health-mocks.js';
import { filterWeights, journeyProgress, ordered, weightProgress } from './health-calculations.js';

const repository = new HealthRepository();
const get = id => document.getElementById(id);
const number = value => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value);
const kg = value => `${number(value)} kg`;
const km = value => `${number(value)} km`;
const dateLabel = value => new Date(`${value}T12:00:00`).toLocaleDateString('pl-PL');
const todayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};
const parsePositive = value => {
    const trimmed = value.trim();
    if (!/^\d+(?:[,.]\d{1,2})?$/.test(trimmed)) return null;
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
    && value <= todayKey();

let state;
let range = 'three';
let disposeChart = () => {};

function status(message) { get('health-status').textContent = message; }
function formError(form, message) { form.querySelector('.health-form-error').textContent = message; }
function runChange(change, message, dialog) {
    try {
        state = change();
        render();
        dialog?.close();
        status(message);
        return true;
    } catch (error) {
        const text = error.message || 'Nie udało się zapisać danych.';
        const form = dialog?.querySelector('form');
        if (form) formError(form, text);
        else status(text);
        return false;
    }
}

function renderWeight() {
    const progress = weightProgress(state.weights, state.goalKg);
    get('latest-weight').textContent = progress.latest ? kg(progress.latest.kg) : '—';
    get('latest-date').textContent = progress.latest ? `Zapisano ${dateLabel(progress.latest.date)}` : 'Dodaj pierwszy pomiar';
    get('goal-weight').textContent = kg(state.goalKg);
    get('start-weight').textContent = progress.first ? kg(progress.first.kg) : '—';
    get('weight-change').textContent = progress.change === null ? '—' : `${progress.change > 0 ? '+' : ''}${kg(progress.change)}`;
    get('weight-remaining').textContent = progress.remaining === null ? '—' : progress.reached ? 'Cel osiągnięty' : kg(progress.remaining);
    get('weight-percent').textContent = `${progress.percent}%`;
    get('weight-fill').style.width = `${progress.percent}%`;
    get('weight-track').setAttribute('aria-valuenow', String(progress.percent));
    get('weight-progress-note').textContent = !progress.first ? 'Postęp pojawi się po pierwszym pomiarze.'
        : progress.reached ? 'Cel osiągnięty. Możesz ustalić kolejny.'
            : progress.first.kg <= state.goalKg ? 'Cel jest powyżej wagi początkowej — zapisz kolejne pomiary, aby śledzić postęp.'
                : `${kg(progress.first.kg)} na starcie → ${kg(state.goalKg)} w celu`;
}

function chartDocument() {
    const entries = filterWeights(state.weights, range);
    return { version: 1, charts: [{
        id: 'health-weight', type: 'line', title: 'Zapisane pomiary', description: '',
        xAxis: { type: 'date', label: 'Data' }, yAxis: { label: 'Waga', unit: 'kg' },
        series: [{ id: 'weight', label: 'Waga', points: entries.map(entry => ({ id: entry.id, x: entry.date, y: entry.kg, details: [] })) }],
        referenceLines: [{ value: state.goalKg, label: 'Cel' }],
    }] };
}

function renderChart() {
    disposeChart();
    disposeChart = renderCharts(get('weight-chart'), chartDocument());
    for (const button of document.querySelectorAll('[data-range]')) {
        const selected = button.dataset.range === range;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
    }
}

function makeHistory(root, entries, kind) {
    root.replaceChildren();
    if (!entries.length) {
        const empty = document.createElement('p');
        empty.className = 'health-empty';
        empty.textContent = kind === 'weight' ? 'Nie ma jeszcze pomiarów wagi. Zapisz pierwszy pomiar.' : 'Nie ma jeszcze wpisów dystansu. Dodaj pierwszy spacer lub bieg.';
        root.append(empty);
        return;
    }
    for (const entry of [...ordered(entries)].reverse()) {
        const row = document.createElement('article'); row.className = 'health-entry';
        const main = document.createElement('div'); main.className = 'health-entry-main';
        const value = document.createElement('strong'); value.textContent = kind === 'weight' ? kg(entry.kg) : km(entry.km);
        const date = document.createElement('time'); date.dateTime = entry.date; date.textContent = dateLabel(entry.date);
        main.append(value, date);
        if (entry.note) { const note = document.createElement('p'); note.textContent = entry.note; main.append(note); }
        const actions = document.createElement('div'); actions.className = 'health-entry-actions';
        for (const [action, label] of [['edit', 'Edytuj'], ['delete', 'Usuń']]) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'btn-link';
            button.dataset.action = action; button.dataset.id = entry.id; button.textContent = label;
            button.setAttribute('aria-label', `${label} ${kind === 'weight' ? 'pomiar wagi' : 'wpis dystansu'} z ${dateLabel(entry.date)}`);
            actions.append(button);
        }
        row.append(main, actions); root.append(row);
    }
}

function renderJourney() {
    const path = paths.find(item => item.id === state.pathId);
    const progress = journeyProgress(state.distances, path);
    get('path-name').textContent = path.name;
    get('journey-total').textContent = km(progress.total);
    get('journey-percent').textContent = `${progress.percent}%`;
    get('journey-stage').textContent = progress.next ? `${progress.current.name} → ${progress.next.name}` : 'Mordor — trasa ukończona';
    get('journey-next').textContent = progress.next ? `${km(progress.toNext)} do przystanku ${progress.next.name}` : 'Dotarłeś do końca ścieżki.';
    const length = path.stops.at(-1).distance;
    const fraction = Math.min(1, progress.total / length);
    get('route-fill').style.height = `${100 * fraction}%`;
    get('route-position').style.top = `${5 + 90 * fraction}%`;
    const list = get('route-stops'); list.replaceChildren();
    for (const stop of path.stops) {
        const item = document.createElement('li');
        item.style.top = `${5 + 90 * stop.distance / length}%`;
        item.className = stop.distance <= progress.total ? 'completed' : stop === progress.next ? 'upcoming' : '';
        const name = document.createElement('strong'); name.textContent = stop.name;
        const distance = document.createElement('span'); distance.textContent = km(stop.distance);
        item.append(name, distance); list.append(item);
    }
}

function render() {
    renderWeight();
    renderChart();
    makeHistory(get('weight-history'), state.weights, 'weight');
    get('weight-count').textContent = `${state.weights.length} ${state.weights.length === 1 ? 'wpis' : 'wpisów'}`;
    renderJourney();
    makeHistory(get('distance-history'), state.distances, 'distance');
    get('distance-count').textContent = `${state.distances.length} ${state.distances.length === 1 ? 'wpis' : 'wpisów'}`;
}

function openEntry(kind, entry = null) {
    const dialog = get(`${kind}-dialog`), form = get(`${kind}-form`);
    form.reset(); formError(form, '');
    form.elements.namedItem('id').value = entry?.id || '';
    form.elements.namedItem('value').value = entry ? String(kind === 'weight' ? entry.kg : entry.km).replace('.', ',') : '';
    form.elements.namedItem('date').value = entry?.date || todayKey();
    form.elements.namedItem('date').max = todayKey();
    form.elements.namedItem('note').value = entry?.note || '';
    get(`${kind}-dialog-title`).textContent = entry ? (kind === 'weight' ? 'Edytuj wagę' : 'Edytuj dystans') : (kind === 'weight' ? 'Zapisz wagę' : 'Dodaj dystans');
    dialog.showModal(); form.elements.namedItem('value').focus();
}

function handleEntrySubmit(kind, event) {
    event.preventDefault();
    const form = event.currentTarget, dialog = get(`${kind}-dialog`);
    const id = form.elements.namedItem('id').value || undefined;
    const value = parsePositive(form.elements.namedItem('value').value);
    const date = form.elements.namedItem('date').value;
    const note = form.elements.namedItem('note').value.trim();
    if (value === null) { formError(form, 'Wpisz dodatnią liczbę. Możesz użyć przecinka i maksymalnie dwóch miejsc po nim.'); return; }
    if (!validDate(date)) { formError(form, 'Wybierz poprawną datę, nie późniejszą niż dzisiaj.'); return; }
    if (kind === 'weight') {
        const existing = state.weights.find(item => item.date === date && item.id !== id);
        if (existing && !confirm(`Pomiar z ${dateLabel(date)} już istnieje. Czy zaktualizować go nową wagą?`)) return;
        runChange(() => repository.saveWeight({ id, date, kg: value, note }), 'Pomiar wagi zapisany.', dialog);
    } else runChange(() => repository.saveDistance({ id, date, km: value, note }), 'Dystans zapisany.', dialog);
}

function handleHistory(kind, event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const entry = state[kind === 'weight' ? 'weights' : 'distances'].find(item => item.id === button.dataset.id);
    if (!entry) return;
    if (button.dataset.action === 'edit') { openEntry(kind, entry); return; }
    const label = kind === 'weight' ? 'pomiar wagi' : 'wpis dystansu';
    if (!confirm(`Usunąć ${label} z ${dateLabel(entry.date)}?`)) return;
    runChange(() => kind === 'weight' ? repository.deleteWeight(entry.id) : repository.deleteDistance(entry.id), `${label[0].toUpperCase()}${label.slice(1)} usunięty.`);
}

function renderPathCatalog() {
    const catalog = get('path-catalog'); catalog.replaceChildren();
    for (const path of paths) {
        const card = document.createElement('article'); card.className = 'path-option';
        const title = document.createElement('h3'); title.textContent = path.name;
        const description = document.createElement('p'); description.textContent = path.description;
        const stops = document.createElement('p'); stops.className = 'path-stops'; stops.textContent = path.stops.map(stop => stop.name).join(' · ');
        const button = document.createElement('button'); button.type = 'button'; button.className = 'btn-secondary';
        button.textContent = path.id === state.pathId ? 'Wybrana ścieżka' : 'Wybierz tę ścieżkę';
        button.disabled = path.id === state.pathId;
        button.addEventListener('click', () => runChange(() => repository.choosePath(path.id), 'Ścieżka wybrana.', get('path-dialog')));
        card.append(title, description, stops, button); catalog.append(card);
    }
}

function init() {
    renderAppNav();
    for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => button.closest('dialog').close());
    get('add-weight').addEventListener('click', () => openEntry('weight'));
    get('add-distance').addEventListener('click', () => openEntry('distance'));
    get('weight-form').addEventListener('submit', event => handleEntrySubmit('weight', event));
    get('distance-form').addEventListener('submit', event => handleEntrySubmit('distance', event));
    get('weight-history').addEventListener('click', event => handleHistory('weight', event));
    get('distance-history').addEventListener('click', event => handleHistory('distance', event));
    get('edit-goal').addEventListener('click', () => {
        const form = get('goal-form'); form.reset(); formError(form, '');
        form.elements.namedItem('value').value = String(state.goalKg).replace('.', ',');
        get('goal-dialog').showModal(); form.elements.namedItem('value').focus();
    });
    get('goal-form').addEventListener('submit', event => {
        event.preventDefault();
        const value = parsePositive(event.currentTarget.elements.namedItem('value').value);
        if (value === null) { formError(event.currentTarget, 'Cel musi być dodatnią liczbą.'); return; }
        runChange(() => repository.setGoal(value), 'Cel wagi zaktualizowany.', get('goal-dialog'));
    });
    for (const button of document.querySelectorAll('[data-range]')) button.addEventListener('click', () => { range = button.dataset.range; renderChart(); });
    get('choose-path').addEventListener('click', () => { renderPathCatalog(); get('path-dialog').showModal(); });
    get('reset-demo').addEventListener('click', () => {
        if (confirm('Przywrócić dane demonstracyjne? Wszystkie zapisane zmiany w Health zostaną zastąpione.'))
            runChange(() => repository.reset(), 'Przywrócono przykładowe dane.');
    });
    try { state = repository.getState(); render(); }
    catch (error) { status(`${error.message || 'Nie udało się odczytać danych.'} Możesz przywrócić przykładowe dane.`); }
    window.addEventListener('pagehide', () => disposeChart());
    window.addEventListener('pageshow', event => { if (event.persisted) { try { state = repository.getState(); render(); } catch (error) { status(error.message); } } });
}

document.addEventListener('DOMContentLoaded', init);
