// src/components/settings/ApiSupportToggle.tsx

import { Flex, Text, Switch, Badge, Callout } from '@radix-ui/themes';
import { useAppStore } from '../../store/appStore';

export default function ApiSupportToggle() {
    const { settings, updateSettings } = useAppStore();

    return (
        <Flex direction="column" gap="3">

        {/* Toggle principal */}
        <Flex align="center" justify="between" gap="4">
        <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
        <Text size="2" weight="bold">
        🔌 Support API
        </Text>
        {!settings.enableApiSupport && (
            <Badge color="gray" variant="soft" size="1">Désactivé</Badge>
        )}
        {settings.enableApiSupport && (
            <Badge color="green" variant="soft" size="1">Actif</Badge>
        )}
        </Flex>
        <Text size="1" color="gray">
        Permet d'associer un endpoint API à chaque tâche
        </Text>
        </Flex>

        <Switch
        size="2"
        checked={settings.enableApiSupport}
        onCheckedChange={(checked) =>
            updateSettings({ enableApiSupport: checked })
        }
        />
        </Flex>

        {/* Message explicatif si activé */}
        {settings.enableApiSupport && (
            <Callout.Root
            color="green"
            variant="soft"
            size="1"
            style={{ borderRadius: 8 }}
            >
            <Callout.Text>
            Le menu API est maintenant visible lors de l'édition d'une tâche.
            </Callout.Text>
            </Callout.Root>
        )}

        </Flex>
    );
}
