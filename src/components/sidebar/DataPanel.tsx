import { useState } from 'react';
import { Flex, Text, Button, Callout } from '@radix-ui/themes';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { Task, AppSettings } from '../../types/koda';
import AboutModal from './AboutModal';
import ReportButton from './ReportButton';

interface Props {
    tasks: Task[];
    settings: AppSettings;
    replaceTasks: (tasks: Task[]) => Promise<void>;
    updateSettings: (partial: Partial<AppSettings>) => void;
}

function sanitizeSettings(value: unknown): Partial<AppSettings> {
    if (!value || typeof value !== 'object') return {};
    const source = value as Record<string, unknown>;
    const result: Partial<AppSettings> = {};
    const booleanKeys = [
        'kioskMode', 'lowBrightnessKiosk', 'enableApiSupport', 'enableCustomActions',
        'globalCommandShortcut', 'agendaEnabled',
    ] as const;
    const stringKeys = [
        'weatherApiKey', 'weatherCity', 'weatherCityId', 'calendarUrl',
        'calendarUsername', 'calendarLastSyncAt',
    ] as const;

    for (const key of booleanKeys) {
        if (typeof source[key] === 'boolean') result[key] = source[key] as boolean;
    }
    for (const key of stringKeys) {
        if (typeof source[key] === 'string') result[key] = source[key] as string;
    }
    if (source.theme === 'dark' || source.theme === 'light') result.theme = source.theme;
    return result;
}

export default function DataPanel({ tasks, settings, replaceTasks, updateSettings }: Props) {
    const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

    function showFeedback(ok: boolean, message: string) {
        setFeedback({ ok, message });
        window.setTimeout(() => setFeedback(null), 5000);
    }

    async function exportJSON() {
        const {
            calendarPassword: _calendarPassword,
            weatherApiKey: _weatherApiKey,
            ...safeSettings
        } = settings;
        const data = JSON.stringify({
            format: 'koda-backup',
            version: 3,
            exportedAt: new Date().toISOString(),
            secretsExcluded: ['calendarPassword', 'weatherApiKey'],
            settings: safeSettings,
            tasks,
            agenda: {
                enabled: settings.agendaEnabled,
                eventCount: tasks.filter((task) => task.calendarEventId).length,
                sources: Array.from(new Set(
                    tasks.flatMap((task) => task.calendarSource ? [task.calendarSource] : [])
                )),
            },
        }, null, 2);
        try {
            const filePath = await save({
                defaultPath: `koda-export-${new Date().toISOString().slice(0, 10)}.json`,
                    filters: [{ name: 'JSON', extensions: ['json'] }],
            });
            if (!filePath) return;
            await writeTextFile(filePath, data);
            const agendaCount = tasks.filter((task) => task.calendarEventId).length;
            showFeedback(true, `Sauvegarde créée (${tasks.length} tâche${tasks.length > 1 ? 's' : ''}, dont ${agendaCount} Agenda).`);
        } catch (e) {
            console.error('Export échoué :', e);
            showFeedback(false, `Export impossible : ${String(e)}`);
        }
    }

    async function importJSON() {
        try {
            const filePath = await open({
                multiple: false,
                filters: [{ name: 'JSON', extensions: ['json'] }],
            });
            if (!filePath || typeof filePath !== 'string') return;
            const content = await readTextFile(filePath);
            const parsed: unknown = JSON.parse(content);
            const container = Array.isArray(parsed)
                ? { version: 0, tasks: parsed, settings: undefined }
                : parsed;

            if (!container || typeof container !== 'object') {
                throw new Error('Le fichier ne contient pas une sauvegarde Koda.');
            }
            const record = container as Record<string, unknown>;
            const incomingTasks = record.tasks;
            if (!Array.isArray(incomingTasks) || !incomingTasks.every((task) => task && typeof task === 'object')) {
                throw new Error('La liste des tâches est absente ou invalide.');
            }
            if (record.version !== 0 && record.version !== 1 && record.version !== 2 && record.version !== 3) {
                throw new Error(`Version de sauvegarde non prise en charge : ${String(record.version)}`);
            }
            if (!window.confirm(`Restaurer ${incomingTasks.length} tâche${incomingTasks.length > 1 ? 's' : ''} ? Les tâches actuelles seront remplacées.`)) {
                return;
            }

            await replaceTasks(incomingTasks as Task[]);
            if (record.settings && typeof record.settings === 'object') {
                updateSettings(sanitizeSettings(record.settings));
            }
            showFeedback(true, `Sauvegarde restaurée (${incomingTasks.length} tâche${incomingTasks.length > 1 ? 's' : ''}).`);
        } catch (e) {
            console.error('Import échoué :', e);
            showFeedback(false, `Import impossible : ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    return (
        <>
        <Text size="1" color="gray" weight="bold" mb="2">DONNÉES</Text>
        <Flex direction="column" gap="2">
        <Button variant="soft" size="2" onClick={exportJSON}>
        📤 Exporter JSON
        </Button>
        <Button variant="soft" size="2" color="indigo" onClick={importJSON}>
        📥 Importer JSON
        </Button>
        {feedback && (
            <Callout.Root size="1" color={feedback.ok ? 'green' : 'red'}>
            <Callout.Text>{feedback.ok ? '✓' : '⚠'} {feedback.message}</Callout.Text>
            </Callout.Root>
        )}
        <ReportButton />
        <AboutModal />
        </Flex>
        </>
    );
}
