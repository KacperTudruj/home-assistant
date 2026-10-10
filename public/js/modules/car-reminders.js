let selectedCar = null;
let requestVersion = 0;
let editingId = null;
let entries = [];

export function formatRemaining(reminder) {
    if (reminder.status === 'COMPLETED') return 'Wykonane';
    if (reminder.status === 'ARCHIVED') return 'Archiwalne';
    if (!reminder.remaining) return 'Brak danych o przebiegu';
    const { value, unit } = reminder.remaining;
    if (value === 0) return unit === 'DAYS' ? 'Dzisiaj' : 'Osiągnięty przebieg';
    const amount = Math.abs(value).toLocaleString('pl-PL');
    const label = unit === 'KM' ? 'km' : Math.abs(value) === 1 ? 'dzień' : 'dni';
    return value > 0 ? `Za ${amount} ${label}` : `Przekroczono o ${amount} ${label}`;
}

const element = id => document.getElementById(id);

async function api(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Błąd żądania (${res.status})`);
    }
    return res.json();
}

function targetFields() {
    const isDate = element('reminder-kind').value === 'DATE';
    element('reminder-date-row').hidden = !isDate;
    element('reminder-mileage-row').hidden = isDate;
    element('reminder-date').required = isDate;
    element('reminder-mileage').required = !isDate;
}

function openForm(reminder = null) {
    if (!selectedCar?.isActive) return;
    editingId = reminder?.id ?? null;
    element('reminder-form').reset();
    element('reminder-form-error').textContent = '';
    element('reminder-dialog-title').textContent = reminder ? 'Edytuj przypomnienie' : 'Dodaj przypomnienie';
    element('reminder-title').value = reminder?.title ?? '';
    element('reminder-info').value = reminder?.additionalInfo ?? '';
    element('reminder-kind').value = reminder?.kind ?? 'MILEAGE';
    element('reminder-date').value = reminder?.dueDate ?? '';
    element('reminder-mileage').value = reminder?.dueMileageKm ?? '';
    element('reminder-lifecycle').value = reminder?.lifecycle ?? 'ACTIVE';
    targetFields();
    element('reminder-dialog').showModal();
}

function appendText(parent, tag, text, className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    parent.appendChild(node);
    return node;
}

async function changeLifecycle(reminder, complete) {
    const carId = selectedCar?.id;
    const buttons = element('reminder-list').querySelectorAll('button');
    buttons.forEach(button => { button.disabled = true; });
    element('reminder-error').textContent = '';
    try {
        await api(`/api/reminders/${encodeURIComponent(reminder.id)}${complete ? '/complete' : ''}`, {
            method: complete ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            ...(complete ? {} : { body: JSON.stringify({ lifecycle: 'ARCHIVED' }) })
        });
        if (selectedCar?.id === carId) await refreshReminders();
    } catch (error) {
        if (selectedCar?.id === carId) {
            element('reminder-error').textContent = error.message;
            render();
        }
    }
}

function render() {
    const list = element('reminder-list');
    list.replaceChildren();
    if (!entries.length) {
        appendText(list, 'li', 'Brak przypomnień dla wybranego filtra.');
        return;
    }
    for (const reminder of entries) {
        const li = appendText(list, 'li', '', `reminder-item reminder-${reminder.status.toLowerCase()}`);
        appendText(li, 'h3', reminder.title);
        appendText(li, 'p', formatRemaining(reminder), 'reminder-remaining');
        appendText(li, 'p', reminder.kind === 'DATE' ? `Termin: ${reminder.dueDate}` : `Przebieg docelowy: ${reminder.dueMileageKm.toLocaleString('pl-PL')} km`);
        if (reminder.kind === 'MILEAGE' && reminder.currentMileageKm !== null) {
            const date = reminder.mileageRecordedAt ? ` (${new Date(reminder.mileageRecordedAt).toLocaleDateString('pl-PL')})` : '';
            const source = reminder.mileageSource === 'PURCHASE' ? 'Przebieg zakupu' : 'Ostatni zapisany przebieg';
            appendText(li, 'p', `${source}: ${reminder.currentMileageKm.toLocaleString('pl-PL')} km${date}`, 'service-sub-info');
        }
        if (reminder.additionalInfo) appendText(li, 'p', reminder.additionalInfo, 'reminder-info');
        if (!reminder.contextAvailable) appendText(li, 'p', 'Powiązany obiekt już nie istnieje.');
        const actions = appendText(li, 'div', '', 'reminder-actions');
        const button = (text, action, disabled = false) => {
            const node = appendText(actions, 'button', text, 'btn-secondary');
            node.type = 'button';
            node.disabled = disabled;
            node.addEventListener('click', action);
        };
        const editable = selectedCar.isActive && reminder.contextActive && reminder.contextAvailable;
        button('Edytuj', () => openForm(reminder), !editable);
        if (reminder.lifecycle === 'ACTIVE') button('Wykonane', () => changeLifecycle(reminder, true), !editable);
        if (reminder.lifecycle !== 'ARCHIVED') button('Archiwizuj', () => changeLifecycle(reminder, false));
    }
}

export async function refreshReminders() {
    if (!selectedCar) return;
    const version = ++requestVersion;
    const query = new URLSearchParams({ moduleKey: 'car', resourceId: selectedCar.id });
    const lifecycle = element('reminder-filter').value;
    if (lifecycle) query.set('lifecycle', lifecycle);
    element('reminder-error').textContent = '';
    element('reminder-list').textContent = 'Ładowanie przypomnień…';
    try {
        const result = await api(`/api/reminders?${query}`);
        if (version !== requestVersion) return;
        entries = result;
        render();
    } catch (error) {
        if (version !== requestVersion) return;
        entries = [];
        element('reminder-list').replaceChildren();
        element('reminder-error').textContent = `Nie udało się wczytać przypomnień. ${error.message}`;
    }
}

export function loadCarReminders(car) {
    if (selectedCar?.id !== car.id) element('reminder-dialog').close();
    selectedCar = car;
    element('add-reminder-btn').disabled = !car.isActive;
    element('reminder-inactive').hidden = car.isActive;
    return refreshReminders();
}

export function initCarReminders() {
    element('add-reminder-btn').addEventListener('click', () => openForm());
    element('reminder-filter').addEventListener('change', refreshReminders);
    element('refresh-reminders-btn').addEventListener('click', refreshReminders);
    element('reminder-kind').addEventListener('change', targetFields);
    element('cancel-reminder').addEventListener('click', () => element('reminder-dialog').close());
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshReminders();
    });
    element('reminder-form').addEventListener('submit', async event => {
        event.preventDefault();
        if (!selectedCar?.isActive) return;
        const carId = selectedCar.id;
        const id = editingId;
        const kind = element('reminder-kind').value;
        const body = {
            title: element('reminder-title').value,
            kind,
            dueDate: kind === 'DATE' ? element('reminder-date').value : null,
            dueMileageKm: kind === 'MILEAGE' ? Number(element('reminder-mileage').value) : null,
            additionalInfo: element('reminder-info').value || null,
            lifecycle: element('reminder-lifecycle').value,
            ...(id ? {} : { moduleKey: 'car', resourceId: carId })
        };
        element('save-reminder').disabled = true;
        element('reminder-form-error').textContent = '';
        try {
            await api(`/api/reminders${id ? `/${encodeURIComponent(id)}` : ''}`, {
                method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
            if (selectedCar?.id === carId) {
                element('reminder-dialog').close();
                await refreshReminders();
            }
        } catch (error) {
            if (selectedCar?.id === carId) element('reminder-form-error').textContent = error.message;
        } finally {
            element('save-reminder').disabled = false;
        }
    });
}
