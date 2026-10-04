// src/components/sidebar/ReportButton.tsx

import { useEffect, useState } from 'react';
import { Button, Dialog, Flex, Text, ScrollArea, TextField } from '@radix-ui/themes';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import type { Task } from '../../types/koda';
import { useAppStore } from '../../store/appStore';
import { generateReport } from '../../utils/reportGenerator';
import { toDateKey, todayKey } from '../../utils/dates';

type ReportScope = 'today' | 'date' | 'without-agenda';

function tasksForReport(tasks: Task[], scope: ReportScope, date: string): Task[] {
    if (scope === 'without-agenda') return tasks.filter((task) => !task.calendarEventId);
    const targetDay = scope === 'today' ? todayKey() : date;
    return tasks.filter((task) => {
        const scheduledDay = toDateKey(task.scheduledFor);
        const completedDay = toDateKey(task.completedAt);
        const changedDay = toDateKey(task.updatedAt);
        return scheduledDay === targetDay || completedDay === targetDay || (!task.calendarEventId && changedDay === targetDay);
    });
}

function reportTitle(scope: ReportScope, date: string): string {
    if (scope === 'today') return 'RAPPORT DU JOUR';
    if (scope === 'date') return `RAPPORT DU ${date}`;
    return 'RAPPORT HORS AGENDA';
}

export default function ReportButton() {
    const { tasks } = useAppStore();
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState('');
    const [scope, setScope] = useState<ReportScope>('today');
    const [reportDay, setReportDay] = useState(todayKey());

    function openPreview() {
        setOpen(true);
    }

    useEffect(() => {
        if (!open) return;
        const selectedTasks = tasksForReport(tasks, scope, reportDay);
        setPreview(generateReport(selectedTasks, reportTitle(scope, reportDay)));
    }, [open, tasks, scope, reportDay]);

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
        📊 Créer un rapport ciblé
        </Text>
        </Dialog.Title>

        <Flex direction="column" gap="2" mt="4">
        <Text size="2" color="gray">Choisis les tâches à inclure.</Text>
        <Flex gap="2" wrap="wrap">
        <Button size="1" variant={scope === 'today' ? 'solid' : 'soft'} onClick={() => setScope('today')}>Aujourd’hui</Button>
        <Button size="1" variant={scope === 'date' ? 'solid' : 'soft'} onClick={() => setScope('date')}>Jour choisi</Button>
        <Button size="1" variant={scope === 'without-agenda' ? 'solid' : 'soft'} onClick={() => setScope('without-agenda')}>Hors Agenda</Button>
        </Flex>
        {scope === 'date' && (
            <TextField.Root type="date" value={reportDay} onChange={(event) => setReportDay(event.target.value)} />
        )}
        <Text size="1" color="gray">
        {scope === 'today' && 'Inclut les événements, réalisations et changements d’aujourd’hui.'}
        {scope === 'date' && 'Inclut les événements, réalisations et changements du jour choisi.'}
        {scope === 'without-agenda' && 'Inclut toutes les tâches manuelles, sans les événements importés.'}
        </Text>
        </Flex>

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
