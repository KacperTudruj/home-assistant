import { renderAppNav } from './navigation.js';
import { renderCharts } from './chart-renderer.js';
import { HealthRepository } from './health-repository.js';
import { paths } from './health-paths.js';
import { filterWeights, journeyProgress, weightProgress } from './health-calculations.js';
import { dateLabel, kg, km, parsePositive, todayKey, validDate } from './health-input.js';

const repository = new HealthRepository();
const get = id => document.getElementById(id);
let state;
let range = 'three';
let disposeChart = () => {};

function status(message) { get('health-status').textContent = message; }
function formError(form, message) { form.querySelector('.health-form-error').textContent = message; }
function setReady(ready) {
    for (const id of ['add-weight', 'add-distance', 'edit-goal', 'choose-path']) get(id).disabled = !ready;
    for (const button of document.querySelectorAll('[data-range]')) button.disabled = !ready;
}

async function runChange(change, message, dialog) {
    try {
        await change();
        state = await repository.getState();
        render();
        dialog?.close();
        status(message);
    } catch (error) {
        const form = dialog?.querySelector('form');
        if (form) formError(form, error.message);
        else status(error.message || 'Nie udało się zapisać danych.');
    }
}

function renderWeight() {
    const progress = weightProgress(state.weights, state.goalKg);
    get('latest-weight').textContent = progress.latest ? kg(progress.latest.kg) : '—';
    get('latest-date').textContent = progress.latest ? `Zapisano ${dateLabel(progress.latest.date)}` : 'Dodaj pierwszy pomiar';
    get('goal-weight').textContent = state.goalKg === null ? '—' : kg(state.goalKg);
    get('edit-goal').textContent = state.goalKg === null ? 'Ustaw cel' : 'Zmień cel';
    get('start-weight').textContent = progress.first ? kg(progress.first.kg) : '—';
    get('weight-change').textContent = progress.change === null ? '—' : `${progress.change > 0 ? '+' : ''}${kg(progress.change)}`;
    get('weight-remaining').textContent = state.goalKg === null ? 'Ustaw cel' : progress.remaining === null ? '—' : progress.reached ? 'Cel osiągnięty' : kg(progress.remaining);
    get('weight-percent').textContent = `${progress.percent}%`;
    get('weight-fill').style.width = `${progress.percent}%`;
    get('weight-track').setAttribute('aria-valuenow', String(progress.percent));
    get('weight-progress-note').textContent = state.goalKg === null ? 'Ustaw własny cel, aby śledzić postęp.'
        : !progress.first ? 'Postęp pojawi się po pierwszym pomiarze.'
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
        referenceLines: state.goalKg === null ? [] : [{ value: state.goalKg, label: 'Cel' }],
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

function renderJourney() {
    const path = paths.find(item => item.id === state.pathId) || paths[0];
    const progress = journeyProgress(state.distances, path);
    get('path-name').textContent = path.name;
    get('journey-total').textContent = km(progress.total);
    get('journey-percent').textContent = `${progress.percent}%`;
    get('journey-stage').textContent = progress.next ? `${progress.current.name} → ${progress.next.name}` : `${path.stops.at(-1).name} — trasa ukończona`;
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

function render() { renderJourney(); renderWeight(); renderChart(); }

function openEntry(kind) {
    const dialog = get(`${kind}-dialog`), form = get(`${kind}-form`);
    form.reset(); formError(form, '');
    form.elements.namedItem('value').value = '';
    form.elements.namedItem('date').value = todayKey();
    form.elements.namedItem('date').max = todayKey();
    dialog.showModal(); form.elements.namedItem('value').focus();
}

async function handleEntrySubmit(kind, event) {
    event.preventDefault();
    const form = event.currentTarget, dialog = get(`${kind}-dialog`);
    const value = parsePositive(form.elements.namedItem('value').value);
    const date = form.elements.namedItem('date').value;
    const note = form.elements.namedItem('note').value.trim();
    if (value === null) { formError(form, 'Wpisz dodatnią liczbę. Możesz użyć przecinka i maksymalnie dwóch miejsc po nim.'); return; }
    if (!validDate(date)) { formError(form, 'Wybierz poprawną datę, nie późniejszą niż dzisiaj.'); return; }
    if (kind === 'weight') {
        const existing = state.weights.find(item => item.date === date);
        if (existing && !confirm(`Pomiar z ${dateLabel(date)} już istnieje. Czy zaktualizować go nową wagą?`)) return;
        await runChange(() => repository.saveWeight({ date, kg: value, note }, Boolean(existing)), 'Pomiar wagi zapisany.', dialog);
    } else await runChange(() => repository.saveDistance({ date, km: value, note }), 'Dystans zapisany.', dialog);
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

async function load() {
    setReady(false);
    try { state = await repository.getState(); render(); status(''); setReady(true); }
    catch (error) { state = undefined; status(error.message || 'Nie udało się wczytać danych. Odśwież stronę.'); }
}

function init() {
    renderAppNav();
    for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => button.closest('dialog').close());
    get('add-weight').addEventListener('click', () => openEntry('weight'));
    get('add-distance').addEventListener('click', () => openEntry('distance'));
    get('weight-form').addEventListener('submit', event => handleEntrySubmit('weight', event));
    get('distance-form').addEventListener('submit', event => handleEntrySubmit('distance', event));
    get('edit-goal').addEventListener('click', () => {
        const form = get('goal-form'); form.reset(); formError(form, '');
        form.elements.namedItem('value').value = state.goalKg === null ? '' : String(state.goalKg).replace('.', ',');
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
    window.addEventListener('pagehide', () => disposeChart());
    window.addEventListener('pageshow', event => { if (event.persisted) load(); });
    status('Ładowanie danych…');
    setReady(false);
    load();
}

document.addEventListener('DOMContentLoaded', init);
