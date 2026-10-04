import { useState } from 'react';
import {
    AlertDialog, Flex, Text, Switch, TextField,
    Separator, Button, Dialog, ScrollArea,
} from '@radix-ui/themes';
import { AppSettings, CalendarEvent } from '../../types/koda';
import ApiSupportToggle from '../settings/ApiSupportToggle';
import CustomActionsToggle from '../settings/CustomActionsToggle';
import GlobalShortcutToggle from '../settings/GlobalShortcutToggle';
import { useAppStore } from '../../store/appStore';
import { isHttpUrl } from '../../utils/http';
import { open as openFile } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { toDateKey, todayKey } from '../../utils/dates';

interface Props {
    settings: AppSettings;
    updateSettings: (partial: Partial<AppSettings>) => void;
}

interface PendingIcalImport {
    source: string;
    pastEvents: CalendarEvent[];
    currentEvents: CalendarEvent[];
}

export default function SettingsPanel({ settings, updateSettings }: Props) {
    const [open, setOpen] = useState(false);
    const [agendaMessage, setAgendaMessage] = useState<string | null>(null);
    const [pendingIcalImport, setPendingIcalImport] = useState<PendingIcalImport | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [resetMessage, setResetMessage] = useState<string | null>(null);
    const { syncCalendar, previewIcalContent, importCalendarEvents, resetApp, agendaSyncing, agendaError } = useAppStore();

    async function handleCalendarSync() {
        setAgendaMessage(null);
        try {
            const count = await syncCalendar();
            setAgendaMessage(`${count} événement${count > 1 ? 's' : ''} synchronisé${count > 1 ? 's' : ''}.`);
        } catch {
            // Le détail est fourni par le store sous le formulaire.
        }
    }

    async function handleLocalIcalImport() {
        setAgendaMessage(null);
        try {
            const filePath = await openFile({
                multiple: false,
                filters: [{ name: 'Agenda iCalendar', extensions: ['ics', 'ical'] }],
            });
            if (!filePath || typeof filePath !== 'string') return;
            const content = await readTextFile(filePath);
            const source = filePath.replace(/\\/g, '/').split('/').pop() || 'agenda.ics';
            const events = await previewIcalContent(content);
            const pastEvents = events.filter((event) => {
                const eventDay = toDateKey(event.start);
                return eventDay !== null && eventDay < todayKey();
            });
            const currentEvents = events.filter((event) => !pastEvents.includes(event));

            if (pastEvents.length > 0) {
                setPendingIcalImport({ source, pastEvents, currentEvents });
                return;
            }
            await importSelectedEvents(events, source);
        } catch (error) {
            setAgendaMessage(error instanceof Error ? error.message : 'Import impossible.');
        }
    }

    async function importSelectedEvents(events: CalendarEvent[], source: string) {
        const count = await importCalendarEvents(events, source);
        setAgendaMessage(`${count} événement${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''} depuis ${source}.`);
    }

    async function importWithoutPastEvents() {
        if (!pendingIcalImport) return;
        const { currentEvents, source } = pendingIcalImport;
        setPendingIcalImport(null);
        try {
            await importSelectedEvents(currentEvents, source);
        } catch (error) {
            setAgendaMessage(error instanceof Error ? error.message : 'Import impossible.');
        }
    }

    async function importAllEvents() {
        if (!pendingIcalImport) return;
        const { pastEvents, currentEvents, source } = pendingIcalImport;
        setPendingIcalImport(null);
        try {
            await importSelectedEvents([...pastEvents, ...currentEvents], source);
        } catch (error) {
            setAgendaMessage(error instanceof Error ? error.message : 'Import impossible.');
        }
    }

    async function handleAppReset() {
        setIsResetting(true);
        setResetMessage(null);
        try {
            await resetApp();
            setResetMessage('Application réinitialisée.');
        } catch (error) {
            setResetMessage(error instanceof Error ? error.message : 'Réinitialisation impossible.');
        } finally {
            setIsResetting(false);
        }
    }

    return (
        <>
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
        <Dialog.Description style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        Configure l’apparence, l’agenda et les fonctionnalités de Koda.
        </Dialog.Description>
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

        {/* ─── Agenda ─── */}
        <Text size="1" weight="bold" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Agenda
        </Text>

        <Flex align="center" justify="between" gap="3">
        <Flex direction="column" gap="1">
        <Text size="2" weight="medium">Mode agenda</Text>
        <Text size="1" color="gray" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
        Affiche les événements CalDAV ou iCalendar dans « À faire ».
        </Text>
        </Flex>
        <Switch
        checked={settings.agendaEnabled}
        onCheckedChange={(agendaEnabled) => updateSettings({ agendaEnabled })}
        />
        </Flex>

        {settings.agendaEnabled && (
            <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
            <Text size="2" weight="medium">Agenda présent sur cet ordinateur</Text>
            <Text size="1" color="gray" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
            Sélectionne un export `.ics` provenant d’Apple Calendrier, Thunderbird, GNOME Calendar ou d’un autre agenda.
            </Text>
            </Flex>
            <Button
            variant="solid"
            color="violet"
            disabled={agendaSyncing}
            onClick={() => void handleLocalIcalImport()}
            >
            {agendaSyncing ? '⏳ Import en cours…' : '📂 Importer un fichier .ics de ce PC'}
            </Button>

            <Separator size="4" />
            <Text size="1" weight="bold" color="gray">OU SYNCHRONISER UN AGENDA DISTANT</Text>

            <Flex direction="column" gap="1">
            <Text size="2" weight="medium">URL CalDAV ou iCalendar</Text>
            <TextField.Root
            size="2"
            type="url"
            value={settings.calendarUrl ?? ''}
            onChange={(event) => updateSettings({ calendarUrl: event.target.value })}
            placeholder="https://cloud.example.com/remote.php/dav/..."
            />
            {settings.calendarUrl && !isHttpUrl(settings.calendarUrl) && (
                <Text size="1" color="red">Saisis une URL HTTP ou HTTPS valide.</Text>
            )}
            </Flex>

            <Flex direction="column" gap="1">
            <Text size="2" weight="medium">Identifiant</Text>
            <TextField.Root
            size="2"
            value={settings.calendarUsername ?? ''}
            onChange={(event) => updateSettings({ calendarUsername: event.target.value })}
            placeholder="Facultatif pour un agenda public"
            />
            </Flex>

            <Flex direction="column" gap="1">
            <Text size="2" weight="medium">Mot de passe d’application</Text>
            <TextField.Root
            size="2"
            type="password"
            value={settings.calendarPassword ?? ''}
            onChange={(event) => updateSettings({ calendarPassword: event.target.value })}
            placeholder="Mot de passe CalDAV"
            />
            <Text size="1" color="gray" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
            Utilise de préférence un mot de passe d’application. Il reste stocké localement et n’est jamais inclus dans les exports.
            </Text>
            <Text size="1" color="gray" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
            La synchronisation importe l’agenda en lecture seule : les changements faits dans Koda ne modifient pas le calendrier distant.
            </Text>
            </Flex>

            <Button
            variant="soft"
            color="violet"
            disabled={agendaSyncing || !isHttpUrl(settings.calendarUrl ?? '')}
            onClick={() => void handleCalendarSync()}
            >
            {agendaSyncing ? '⏳ Synchronisation…' : '🔄 Synchroniser maintenant'}
            </Button>
            {agendaMessage && <Text size="1" color="green">✓ {agendaMessage}</Text>}
            {agendaError && <Text size="1" color="red" style={{ whiteSpace: 'normal' }}>{agendaError}</Text>}
            {settings.calendarLastSyncAt && (
                <Text size="1" color="gray">
                Dernière synchronisation : {new Date(settings.calendarLastSyncAt).toLocaleString('fr-FR')}
                </Text>
            )}
            </Flex>
        )}

        <Separator size="4" />

        {/* ─── Fonctionnalités avancées ─── */}
        <Text size="1" weight="bold" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Fonctionnalités avancées
        </Text>

        <ApiSupportToggle />
        <CustomActionsToggle />
        <Separator size="4" />
        <GlobalShortcutToggle />

        <Separator size="4" />

        <Text size="1" weight="bold" color="red" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Zone de réinitialisation
        </Text>
        <Text size="1" color="gray" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
        Supprime toutes les tâches, les événements Agenda et les réglages enregistrés sur cet ordinateur.
        </Text>
        <AlertDialog.Root>
        <AlertDialog.Trigger>
        <Button variant="soft" color="red" disabled={isResetting}>
        {isResetting ? 'Réinitialisation…' : 'Réinitialiser l’application'}
        </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Réinitialiser Koda ?</AlertDialog.Title>
        <AlertDialog.Description>
        Toutes les tâches, les événements Agenda, les réglages et les identifiants enregistrés sur cet ordinateur seront supprimés. Cette action est irréversible.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
        <AlertDialog.Cancel>
        <Button variant="soft" color="gray">Annuler</Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action>
        <Button color="red" onClick={() => void handleAppReset()}>
        Oui, tout supprimer
        </Button>
        </AlertDialog.Action>
        </Flex>
        </AlertDialog.Content>
        </AlertDialog.Root>
        {resetMessage && <Text size="1" color={resetMessage === 'Application réinitialisée.' ? 'green' : 'red'}>{resetMessage}</Text>}

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

        <AlertDialog.Root open={pendingIcalImport !== null}>
        <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Événements passés détectés</AlertDialog.Title>
        <AlertDialog.Description>
        {pendingIcalImport
            ? `${pendingIcalImport.pastEvents.length} événement${pendingIcalImport.pastEvents.length > 1 ? 's' : ''} ${pendingIcalImport.pastEvents.length > 1 ? 'sont' : 'est'} antérieur${pendingIcalImport.pastEvents.length > 1 ? 's' : ''} à aujourd’hui. Souhaites-tu aussi les importer ?`
            : ''}
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
        <AlertDialog.Action>
        <Button variant="soft" color="gray" onClick={() => void importWithoutPastEvents()}>
        Non, ignorer le passé
        </Button>
        </AlertDialog.Action>
        <AlertDialog.Action>
        <Button color="violet" onClick={() => void importAllEvents()}>
        Oui, tout importer
        </Button>
        </AlertDialog.Action>
        </Flex>
        </AlertDialog.Content>
        </AlertDialog.Root>
        </>


    );
}
