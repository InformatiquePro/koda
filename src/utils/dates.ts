export function toDateKey(value?: string): string | null {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

export function todayKey(): string {
    return toDateKey(new Date().toISOString()) as string;
}

export function addDays(dateKey: string, days: number): string {
    const date = new Date(`${dateKey}T12:00:00`);
    date.setDate(date.getDate() + days);
    return toDateKey(date.toISOString()) as string;
}

export function formatDay(dateKey: string, style: 'long' | 'short' = 'long'): string {
    const date = new Date(`${dateKey}T12:00:00`);
    return new Intl.DateTimeFormat('fr-FR', style === 'long' ? {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    } : {
        weekday: 'short', day: 'numeric', month: 'short',
    }).format(date);
}

export function formatSchedule(start: string, end?: string, allDay = false): string {
    const key = toDateKey(start);
    if (!key) return 'Date invalide';
    const day = formatDay(key, 'short');
    if (allDay || /^\d{4}-\d{2}-\d{2}$/.test(start)) return `${day} · journée`;

    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return day;
    const time = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (!end) return `${day} · ${time}`;
    const endDate = new Date(end);
    if (Number.isNaN(endDate.getTime())) return `${day} · ${time}`;
    const endTime = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${time}–${endTime}`;
}
