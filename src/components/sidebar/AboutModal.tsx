import { useState } from 'react';
import { Dialog, Flex, Text, Button, Separator, Badge } from '@radix-ui/themes';
import { open as openUrl } from '@tauri-apps/plugin-shell';

const VERSION = '0.5.0';
const GITHUB = 'https://github.com/InformatiquePro/koda';

export default function AboutModal() {
    const [open, setOpen] = useState(false);

    return (
        <>
        <Button
        variant="ghost"
        size="2"
        color="gray"
        onClick={() => setOpen(true)}
        style={{ width: '100%', justifyContent: 'flex-start' }}
        >
        ℹ️ À propos
        </Button>

        <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content
        style={{
            background: 'rgba(20, 18, 40, 0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            maxWidth: 420,
            textAlign: 'center',
        }}
        >
        {/* Logo / Titre */}
        <Flex direction="column" align="center" gap="3" py="4">
        <Text
        size="8"
        weight="bold"
        style={{
            background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
        }}
        >
        ⚡ Koda
        </Text>

        <Badge color="violet" size="2" variant="soft">v{VERSION}</Badge>

        <Text size="3" color="gray" style={{ lineHeight: 1.6, maxWidth: 300 }}>
        Une application d'organisation{' '}
        <Text weight="bold" style={{ color: '#a78bfa' }}>gratuite</Text>
        {' '}et{' '}
        <Text weight="bold" style={{ color: '#a78bfa' }}>open source</Text>
        {' '}moderne.
        </Text>
        </Flex>

        <Separator size="4" mb="4" />

        {/* Infos */}
        <Flex direction="column" gap="2" mb="4">
        <InfoRow label="Version"   value={`v${VERSION}`} />
        <InfoRow label="Licence"   value="AGPL" />
        <InfoRow label="Auteur"    value="Charles-Elie" />
        <InfoRow label="Framework" value="Tauri 2 + React + Rust" />
        </Flex>

        <Separator size="4" mb="4" />

        {/* Lien GitHub */}
        <Flex direction="column" align="center" gap="3">
        <Button
        size="3"
        variant="soft"
        color="violet"
        style={{ width: '100%' }}
        onClick={() => openUrl(GITHUB)}
        >
        🐙 Voir sur GitHub
        </Button>

        <Text size="1" color="gray" style={{ opacity: 0.5 }}>
        {GITHUB}
        </Text>

        <Button
        variant="soft"
        color="gray"
        size="2"
        onClick={() => setOpen(false)}
        >
        Fermer
        </Button>
        </Flex>

        </Dialog.Content>
        </Dialog.Root>
        </>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <Flex
        align="center"
        justify="between"
        px="3"
        py="1"
        style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
        }}
        >
        <Text size="1" color="gray">{label}</Text>
        <Text size="1" weight="medium">{value}</Text>
        </Flex>
    );
}
