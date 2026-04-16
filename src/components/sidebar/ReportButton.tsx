// src/components/sidebar/ReportButton.tsx

import { useState } from 'react';
import { Button, Dialog, Flex, Text, ScrollArea } from '@radix-ui/themes';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useAppStore } from '../../store/appStore';
import { generateReport } from '../../utils/reportGenerator';

export default function ReportButton() {
    const { tasks } = useAppStore();
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState('');

    function openPreview() {
        setPreview(generateReport(tasks));
        setOpen(true);
    }

    async function exportTxt() {
        const date = new Date().toISOString().slice(0, 10);
        try {
            const filePath = await save({
                defaultPath: `koda-rapport-${date}.txt`,
                    filters: [{ name: 'Texte', extensions: ['txt'] }],
            });
            if (!filePath) return;
            await writeTextFile(filePath, preview);
        } catch (e) {
            console.error('Export rapport échoué :', e);
        }
    }

    return (
        <>
        <Button variant="soft" size="2" color="cyan" onClick={openPreview}>
        📊 Créer un rapport
        </Button>

        <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content
        style={{
            background: 'rgba(10, 8, 30, 0.98)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            maxWidth: 680,
            width: '90vw',
        }}
        >
        <Dialog.Title>
        <Text size="4" weight="bold" style={{ color: 'var(--accent-9)' }}>
        📊 Rapport journalier
        </Text>
        </Dialog.Title>

        {/* Aperçu du rapport */}
        <ScrollArea
        style={{ height: '60vh', marginTop: 16, marginBottom: 16 }}
        >
        <pre
        style={{
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.85)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            padding: '12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
        }}
        >
        {preview}
        </pre>
        </ScrollArea>

        <Flex gap="2" justify="end">
        <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
        Fermer
        </Button>
        <Button
        variant="solid"
        color="cyan"
        onClick={exportTxt}
        style={{ cursor: 'pointer' }}
        >
        💾 Exporter en .txt
        </Button>
        </Flex>
        </Dialog.Content>
        </Dialog.Root>
        </>
    );
}
