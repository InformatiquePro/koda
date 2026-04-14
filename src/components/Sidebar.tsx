import { useState } from 'react';
import { Box, Flex, Text, IconButton, Separator, Switch, TextField, Button } from '@radix-ui/themes';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { useAppStore } from '../store/appStore';
import { Task } from '../types/koda';

export default function Sidebar() {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { sidebarOpen, toggleSidebar, settings, updateSettings, tasks, importTasks } = useAppStore();

    const stats = {
        todo: tasks.filter((t) => t.column === 'TODO').length,
        inProgress: tasks.filter((t) => t.column === 'IN_PROGRESS').length,
        blocked: tasks.filter((t) => t.column === 'BLOCKED').length,
        done: tasks.filter((t) => t.column === 'DONE').length,
    };

    async function exportJSON() {
        if (tasks.length === 0) return;

        // On inclut les settings dans l'export
        const data = JSON.stringify({
            version: 1,
            exportedAt: new Date().toISOString(),
                                    settings: {
                                        weatherCity: settings.weatherCity,
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

            // Support ancien format (tableau direct) et nouveau format (objet avec version)
            if (Array.isArray(parsed)) {
                // Ancien format — juste les tâches
                importTasks(parsed as Task[]);
                return;
            }

            if (parsed.version === 1 && Array.isArray(parsed.tasks)) {
                // Nouveau format — tâches + settings météo
                importTasks(parsed.tasks as Task[]);

                // Restaure les settings météo seulement si présents dans le fichier
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
            alert('Erreur lors de l\'import du fichier.');
        }
    }

    return (
        <Box
        className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}
        style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: sidebarOpen ? '16px' : '12px',
            overflowY: 'auto',
            overflowX: 'hidden',
        }}
        >
        {/* Toggle */}
        <Flex justify={sidebarOpen ? 'between' : 'center'} align="center" mb="4">
        {sidebarOpen && (
            <Text size="4" weight="bold" style={{ color: 'var(--accent-9)' }}>
            ⚡ Koda
            </Text>
        )}
        <IconButton variant="ghost" onClick={toggleSidebar} size="2">
        {sidebarOpen ? '◀' : '▶'}
        </IconButton>
        </Flex>

        {sidebarOpen && (
            <>
            {/* Stats */}
            <Text size="1" color="gray" weight="bold" mb="2">PRODUCTIVITÉ</Text>
            <Flex direction="column" gap="1" mb="4">
            <StatRow label="À faire"  value={stats.todo}       color="var(--col-todo)" />
            <StatRow label="En cours" value={stats.inProgress} color="var(--col-inprogress)" />
            <StatRow label="Bloqué"   value={stats.blocked}    color="var(--col-blocked)" />
            <StatRow label="Fini"     value={stats.done}       color="var(--col-done)" />
            </Flex>

            <Separator size="4" mb="4" />

            {/* Paramètres — menu déroulant */}
            <Box
            style={{
                border: '1px solid var(--glass-border)',
                         borderRadius: '10px',
                         overflow: 'hidden',
                         marginBottom: '8px',
            }}
            >
            {/* En-tête cliquable */}
            <Flex
            align="center"
            justify="between"
            px="3"
            py="2"
            onClick={() => setSettingsOpen((v) => !v)}
            style={{
                cursor: 'pointer',
                background: settingsOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                         transition: 'background 0.2s',
                         userSelect: 'none',
            }}
            >
            <Text size="1" color="gray" weight="bold">
            ⚙️ PARAMÈTRES
            </Text>
            <Text size="1" color="gray">
            {settingsOpen ? '▲' : '▼'}
            </Text>
            </Flex>

            {/* Contenu déroulant */}
            {settingsOpen && (
                <Flex
                direction="column"
                gap="3"
                px="3"
                py="3"
                style={{ borderTop: '1px solid var(--glass-border)' }}
                >
                {/* Mode Kiosk */}
                <Flex align="center" justify="between">
                <Text size="2">Mode Kiosk</Text>
                <Switch
                checked={settings.kioskMode}
                onCheckedChange={(v) => updateSettings({ kioskMode: v })}
                />
                </Flex>

                {/* Basse luminosité */}
                {settings.kioskMode && (
                    <Flex align="center" justify="between">
                    <Text size="2">Basse luminosité</Text>
                    <Switch
                    checked={settings.lowBrightnessKiosk}
                    onCheckedChange={(v) => updateSettings({ lowBrightnessKiosk: v })}
                    />
                    </Flex>
                )}

                {/* Nom de ville */}
                <Flex direction="column" gap="1">
                <Text size="2" color="gray">Ville (nom affiché)</Text>
                <TextField.Root
                size="1"
                value={settings.weatherCity ?? ''}
                onChange={(e) => updateSettings({ weatherCity: e.target.value })}
                placeholder="ex: Quimper"
                />
                </Flex>

                {/* ID ville OpenWeatherMap */}
                <Flex direction="column" gap="1">
                <Text size="2" color="gray">ID Ville OpenWeatherMap</Text>
                <TextField.Root
                size="1"
                value={settings.weatherCityId ?? ''}
                onChange={(e) => updateSettings({ weatherCityId: e.target.value })}
                placeholder="ex: 2975517"
                />
                <Text size="1" color="gray" style={{ opacity: 0.6 }}>
                Trouve ton ID sur{' '}
                <a
                href="https://openweathermap.org/find"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-9)' }}
                >
                openweathermap.org/find
                </a>
                </Text>
                </Flex>

                {/* Clé API */}
                <Flex direction="column" gap="1">
                <Text size="2" color="gray">Clé API OpenWeatherMap</Text>
                <TextField.Root
                size="1"
                type="password"
                value={settings.weatherApiKey ?? ''}
                onChange={(e) => updateSettings({ weatherApiKey: e.target.value })}
                placeholder="Colle ta clé ici"
                />
                </Flex>
                </Flex>
            )}
            </Box>

            {/* Export / Import */}
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
        )}
        </Box>
    );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <Flex
        align="center"
        justify="between"
        style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--glass-bg)' }}
        >
        <Flex align="center" gap="2">
        <Box style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <Text size="1">{label}</Text>
        </Flex>
        <Text size="1" weight="bold">{value}</Text>
        </Flex>
    );
}
