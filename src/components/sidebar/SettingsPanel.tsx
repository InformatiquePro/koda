import { useState } from 'react';
import {
    Flex, Text, Switch, TextField,
    Separator, Button, Dialog, ScrollArea,
} from '@radix-ui/themes';
import { AppSettings } from '../../types/koda';
import ApiSupportToggle from '../settings/ApiSupportToggle';
import CustomActionsToggle from '../settings/CustomActionsToggle';

interface Props {
    settings: AppSettings;
    updateSettings: (partial: Partial<AppSettings>) => void;
}

export default function SettingsPanel({ settings, updateSettings }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>

        {/* Bouton déclencheur dans la sidebar */}
        <Dialog.Trigger>
        <Button
        variant="soft"
        size="2"
        color="gray"
        style={{ width: '100%', cursor: 'pointer', justifyContent: 'flex-start' }}
        >
        ⚙️ Paramètres
        </Button>
        </Dialog.Trigger>

        {/* Pop-up */}
        <Dialog.Content
        style={{
            background: 'rgba(10, 8, 30, 0.98)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            maxWidth: 480,
            width: '90vw',
            padding: 0,
            overflow: 'hidden',
        }}
        >
        {/* En-tête */}
        <Flex
        align="center"
        justify="between"
        px="5"
        py="4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
        <Dialog.Title>
        <Text size="4" weight="bold" style={{ color: 'var(--accent-9)' }}>
        ⚙️ Paramètres
        </Text>
        </Dialog.Title>
        <Dialog.Close>
        <Button variant="ghost" color="gray" size="1" style={{ cursor: 'pointer' }}>
        ✕
        </Button>
        </Dialog.Close>
        </Flex>

        {/* Contenu scrollable */}
        <ScrollArea style={{ maxHeight: '70vh' }}>
        <Flex direction="column" gap="4" p="5">

        {/* ─── Apparence ─── */}
        <Text size="1" weight="bold" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Apparence
        </Text>

        <Flex align="center" justify="between">
        <Flex direction="column" gap="1">
        <Text size="2" weight="medium">Mode Kiosk</Text>
        <Text size="1" color="gray" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
        Affichage plein écran simplifié
        </Text>
        </Flex>
        <Switch
        checked={settings.kioskMode}
        onCheckedChange={(v) => updateSettings({ kioskMode: v })}
        />
        </Flex>

        {settings.kioskMode && (
            <Flex align="center" justify="between">
            <Flex direction="column" gap="1">
            <Text size="2" weight="medium">Basse luminosité</Text>
            <Text size="1" color="gray" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
            Réduit la luminosité en mode kiosk
            </Text>
            </Flex>
            <Switch
            checked={settings.lowBrightnessKiosk}
            onCheckedChange={(v) => updateSettings({ lowBrightnessKiosk: v })}
            />
            </Flex>
        )}

        <Separator size="4" />

        {/* ─── Météo ─── */}
        <Text size="1" weight="bold" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Météo
        </Text>

        <Flex direction="column" gap="1">
        <Text size="2" weight="medium">Ville</Text>
        <TextField.Root
        size="2"
        value={settings.weatherCity ?? ''}
        onChange={(e) => updateSettings({ weatherCity: e.target.value })}
        placeholder="ex: Quimper"
        />
        </Flex>

        <Flex direction="column" gap="1">
        <Text size="2" weight="medium">ID Ville OpenWeatherMap</Text>
        <TextField.Root
        size="2"
        value={settings.weatherCityId ?? ''}
        onChange={(e) => updateSettings({ weatherCityId: e.target.value })}
        placeholder="ex: 2975517"
        />
        <Text size="1" color="gray" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
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

        <Flex direction="column" gap="1">
        <Text size="2" weight="medium">Clé API OpenWeatherMap</Text>
        <TextField.Root
        size="2"
        type="password"
        value={settings.weatherApiKey ?? ''}
        onChange={(e) => updateSettings({ weatherApiKey: e.target.value })}
        placeholder="Colle ta clé ici"
        />
        </Flex>

        <Separator size="4" />

        {/* ─── Fonctionnalités avancées ─── */}
        <Text size="1" weight="bold" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Fonctionnalités avancées
        </Text>

        <ApiSupportToggle />
        <CustomActionsToggle />

        </Flex>
        </ScrollArea>

        {/* Pied de page */}
        <Flex
        justify="end"
        px="5"
        py="3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
        <Dialog.Close>
        <Button variant="solid" color="violet" size="2" style={{ cursor: 'pointer' }}>
        ✓ Fermer
        </Button>
        </Dialog.Close>
        </Flex>

        </Dialog.Content>
        </Dialog.Root>


    );
}
