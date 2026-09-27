import { Flex, Text, Button, Badge } from '@radix-ui/themes';

interface Props {
    running: boolean;
    serverUrl: string | null;
    onStart: () => void;
    onStop: () => void;
}

export default function WebServerPanel({ running, serverUrl, onStart, onStop }: Props) {
    return (
        <>
        <Text size="1" color="gray" weight="bold" mb="2">ACCÈS WEB</Text>
        <Flex direction="column" gap="2" mb="4">
        {!running ? (
            <Button variant="soft" color="violet" size="2" onClick={onStart}>
            🌐 Démarrer le serveur web
            </Button>
        ) : (
            <Flex direction="column" gap="2">
            <Badge color="green" size="2">🟢 Serveur actif</Badge>
            <Text size="1" color="gray">Accède à Koda depuis :</Text>
            <Text
            size="2"
            weight="bold"
            style={{ color: 'var(--accent-9)', wordBreak: 'break-all' }}
            >
            {serverUrl}
            </Text>
            <Text size="1" color="gray" style={{ opacity: 0.6 }}>
            Ouvre cette URL sur n'importe quel appareil du réseau Wi-Fi
            </Text>
            <Button variant="soft" color="red" size="2" onClick={onStop}>
            ⏹ Arrêter le serveur
            </Button>
            </Flex>
        )}
        </Flex>
        </>
    );
}
