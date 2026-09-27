// src/components/settings/GlobalShortcutToggle.tsx

import { Flex, Text, Switch, Badge, Callout } from '@radix-ui/themes';
import { useAppStore } from '../../store/appStore';

export default function GlobalShortcutToggle() {
    const { settings, updateSettings } = useAppStore();

    return (
        <Flex direction="column" gap="3">
        <Flex align="center" justify="between" gap="4">
        <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
        <Text size="2" weight="bold">
        ⚡ Commande permanente
        </Text>
        {settings.globalCommandShortcut
            ? <Badge color="green" variant="soft" size="1">Actif</Badge>
            : <Badge color="gray"  variant="soft" size="1">Désactivé</Badge>
        }
        </Flex>
        <Text size="1" color="gray">
        Ouvre la palette depuis n'importe quelle application
        </Text>
        <Text size="1" color="gray" style={{ opacity: 0.5 }}>
        Raccourci : <kbd style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4, padding: '1px 6px', fontSize: 11,
        }}>Ctrl+Shift+Space</kbd>
        </Text>
        </Flex>

        <Switch
        size="2"
        checked={settings.globalCommandShortcut}
        onCheckedChange={(checked) =>
            updateSettings({ globalCommandShortcut: checked })
        }
        />
        </Flex>

        {settings.globalCommandShortcut && (
            <Callout.Root color="green" variant="soft" size="1" style={{ borderRadius: 8 }}>
            <Callout.Text>
            Appuie sur <strong>Ctrl+Shift+Space</strong> depuis n'importe où pour ouvrir la palette Koda.
            Une notification confirme chaque action.
            </Callout.Text>
            </Callout.Root>
        )}
        </Flex>
    );
}
