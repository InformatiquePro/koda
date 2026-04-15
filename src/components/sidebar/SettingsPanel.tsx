import { useState } from 'react';
import { Box, Flex, Text, Switch, TextField } from '@radix-ui/themes';
import { AppSettings } from '../../types/koda';

interface Props {
    settings: AppSettings;
    updateSettings: (partial: Partial<AppSettings>) => void;
}

export default function SettingsPanel({ settings, updateSettings }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Box
        style={{
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '12px',
        }}
        >
        {/* En-tête cliquable */}
        <Flex
        align="center"
        justify="between"
        px="3"
        py="2"
        onClick={() => setOpen((v) => !v)}
        style={{
            cursor: 'pointer',
            background: open ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
            transition: 'background 0.2s',
            userSelect: 'none',
        }}
        >
        <Text size="1" color="gray" weight="bold">⚙️ PARAMÈTRES</Text>
        <Text size="1" color="gray">{open ? '▲' : '▼'}</Text>
        </Flex>

        {open && (
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

            {settings.kioskMode && (
                <Flex align="center" justify="between">
                <Text size="2">Basse luminosité</Text>
                <Switch
                checked={settings.lowBrightnessKiosk}
                onCheckedChange={(v) => updateSettings({ lowBrightnessKiosk: v })}
                />
                </Flex>
            )}

            {/* Ville météo */}
            <Flex direction="column" gap="1">
            <Text size="2" color="gray">Ville (nom affiché)</Text>
            <TextField.Root
            size="1"
            value={settings.weatherCity ?? ''}
            onChange={(e) => updateSettings({ weatherCity: e.target.value })}
            placeholder="ex: Quimper"
            />
            </Flex>

            {/* ID ville */}
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
    );
}
