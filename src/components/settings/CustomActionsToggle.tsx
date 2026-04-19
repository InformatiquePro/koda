// src/components/settings/CustomActionsToggle.tsx

import { Flex, Text, Switch, Badge, Callout } from '@radix-ui/themes';
import { useAppStore } from '../../store/appStore';

export default function CustomActionsToggle() {
    const { settings, updateSettings } = useAppStore();

    return (
        <Flex direction="column" gap="3">

        <Flex align="center" justify="between" gap="4">
        <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
        <Text size="2" weight="bold">
        ⚡ Actions contextuelles
        </Text>
        {!settings.enableCustomActions && (
            <Badge color="gray" variant="soft" size="1">Désactivé</Badge>
        )}
        {settings.enableCustomActions && (
            <Badge color="green" variant="soft" size="1">Actif</Badge>
        )}
        </Flex>
        <Text size="1" color="gray" style={{ whiteSpace: 'normal', lineHeight: 1.5 }}>
        Permet d'ajouter des boutons d'action rapide sur chaque tâche
        </Text>
        </Flex>

        <Switch
        size="2"
        checked={settings.enableCustomActions}
        onCheckedChange={(checked) =>
            updateSettings({ enableCustomActions: checked })
        }
        />
        </Flex>

        {settings.enableCustomActions && (
            <Callout.Root
            color="green"
            variant="soft"
            size="1"
            style={{ borderRadius: 8 }}
            >
            <Callout.Text>
            La section "Actions contextuelles" est visible lors de l'édition d'une tâche.
            </Callout.Text>
            </Callout.Root>
        )}

        </Flex>
    );
}
