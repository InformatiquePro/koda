import { Flex, Text, Button } from '@radix-ui/themes';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { Task, AppSettings } from '../../types/koda';

interface Props {
    tasks: Task[];
    settings: AppSettings;
    importTasks: (tasks: Task[]) => void;
    updateSettings: (partial: Partial<AppSettings>) => void;
}

export default function DataPanel({ tasks, settings, importTasks, updateSettings }: Props) {

    async function exportJSON() {
        if (tasks.length === 0) return;
        const data = JSON.stringify({
            version: 1,
            exportedAt: new Date().toISOString(),
                                    settings: {
                                        weatherCity:   settings.weatherCity,
                                        weatherCityId: settings.weatherCityId,
                                        weatherApiKey: settings.weatherApiKey,
                                    },
                                    tasks,
        }, null, 2);
        try {
            const filePath = await save({
                defaultPath: `koda-export-${new Date().toISOString().slice(0, 10)}.json`,
                    filters: [{ name: 'JSON', extensions: ['json'] }],
            });
            if (!filePath) return;
            await writeTextFile(filePath, data);
        } catch (e) {
            console.error('Export échoué :', e);
        }
    }

    async function importJSON() {
        try {
            const filePath = await open({
                multiple: false,
                filters: [{ name: 'JSON', extensions: ['json'] }],
            });
            if (!filePath) return;
            const content = await readTextFile(filePath as string);
            const parsed = JSON.parse(content);

            if (Array.isArray(parsed)) {
                importTasks(parsed as Task[]);
                return;
            }
            if (parsed.version === 1 && Array.isArray(parsed.tasks)) {
                importTasks(parsed.tasks as Task[]);
                const incoming = parsed.settings ?? {};
                updateSettings({
                    ...(incoming.weatherCity   && { weatherCity:   incoming.weatherCity }),
                               ...(incoming.weatherCityId && { weatherCityId: incoming.weatherCityId }),
                               ...(incoming.weatherApiKey && { weatherApiKey: incoming.weatherApiKey }),
                });
                return;
            }
            alert('Fichier invalide — ce n\'est pas un export Koda.');
        } catch (e) {
            console.error('Import échoué :', e);
            alert('Erreur lors de l\'import.');
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
        </Flex>
        </>
    );
}
