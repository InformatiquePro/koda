// src/components/subtasks

import { useState } from 'react';
import { Flex, Text, Badge, Dialog, Button } from '@radix-ui/themes';
import { SubTask } from '../../types/koda';
import SubTaskItem from './SubTaskItem';

interface Props {
    subTasks: SubTask[];
    isInProgress: boolean;
    onUpdate: (updated: SubTask[]) => void;
    onAllDone: () => void;
    onAllBlocked: () => void;   // ← nouveau
}

export default function SubTaskList({ subTasks, isInProgress, onUpdate, onAllDone, onAllBlocked }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [blockedModalOpen, setBlockedModalOpen] = useState(false);

    if (!subTasks || subTasks.length === 0) return null;

    const doneCount    = subTasks.filter((s) => s.status === 'done').length;
    const blockedCount = subTasks.filter((s) => s.status === 'blocked').length;
    const total        = subTasks.length;
    const allDone      = doneCount === total;
    const pct          = Math.round((doneCount / total) * 100);

    function handleUpdate(updated: SubTask) {
        const newList = subTasks.map((s) => (s.id === updated.id ? updated : s));
        onUpdate(newList);

        const nowDone    = newList.filter((s) => s.status === 'done').length;
        const nowBlocked = newList.filter((s) => s.status === 'blocked').length;

        // Toutes terminées → proposer DONE
        if (nowDone === total) {
            onAllDone();
            return;
        }

        // Toutes traitées (done + blocked) mais au moins 1 bloquée → proposer BLOCKED
        if (nowDone + nowBlocked === total && nowBlocked > 0) {
            setBlockedModalOpen(true);
        }
    }
    return (
        <>
        <Flex direction="column" gap="1" mt="1">

        {/* En-tête cliquable */}
        <Flex
        align="center" justify="between"
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        >
        <Flex align="center" gap="2">
        <Text size="1" color="gray">
        {expanded ? '▼' : '▶'} Sous-tâches
        </Text>
        <Badge
        color={allDone ? 'green' : blockedCount > 0 ? 'red' : 'gray'}
        size="1" variant="soft"
        >
        {doneCount}/{total}
        </Badge>
        {blockedCount > 0 && (
            <Badge color="red" size="1" variant="soft">
            🔴 {blockedCount} bloquée{blockedCount > 1 ? 's' : ''}
            </Badge>
        )}
        </Flex>
        <Text size="1" color="gray">{pct}%</Text>
        </Flex>

        {/* Barre de progression */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
            height: '100%',
            width: `${pct}%`,
            background: allDone ? '#22c55e' : blockedCount > 0 ? '#ef4444' : 'var(--accent-9)',
            borderRadius: 99,
            transition: 'width 0.3s ease',
        }} />
        </div>

        {/* Liste dépliable */}
        {expanded && (
            <Flex direction="column" gap="1" mt="1">
            {subTasks.map((sub) => (
                <SubTaskItem
                key={sub.id}
                subTask={sub}
                isInProgress={isInProgress}
                onUpdate={handleUpdate}
                />
            ))}
            </Flex>
        )}
        </Flex>

        {/* Modale "certaines sous-tâches sont bloquées" */}
        <Dialog.Root open={blockedModalOpen} onOpenChange={setBlockedModalOpen}>
        <Dialog.Content
        style={{
            background: 'rgba(20, 8, 8, 0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px',
            maxWidth: 400,
        }}
        >
        <Dialog.Title>
        <Text size="4" weight="bold" style={{ color: '#ef4444' }}>
        🔴 Sous-tâches bloquées
        </Text>
        </Dialog.Title>

        <Flex direction="column" gap="3" mt="3">
        <Text size="2" color="gray">
        Toutes les sous-tâches ont été traitées, mais{' '}
        <Text weight="bold" style={{ color: '#ef4444' }}>
        {blockedCount} sont bloquée{blockedCount > 1 ? 's' : ''}
        </Text>
        . Déplacer la tâche dans{' '}
        <Text weight="bold" style={{ color: '#ef4444' }}>BLOQUÉ</Text> ?
        </Text>

        {/* Liste des bloquées */}
        <Flex direction="column" gap="1">
        {subTasks.filter((s) => s.status === 'blocked').map((s) => (
            <Flex key={s.id} direction="column" gap="0">
            <Text size="1" style={{ color: '#ef4444' }}>🔴 {s.label}</Text>
            {s.blockedReason && (
                <Text size="1" color="gray" style={{ paddingLeft: 16 }}>
                └─ {s.blockedReason}
                </Text>
            )}
            </Flex>
        ))}
        </Flex>

        <Flex gap="2" justify="end">
        <Button variant="soft" color="gray" onClick={() => setBlockedModalOpen(false)}>
        Rester en cours
        </Button>
        <Button variant="solid" color="red" onClick={() => {
            setBlockedModalOpen(false);
            onAllBlocked();
        }}>
        🔴 Déplacer dans BLOQUÉ
        </Button>
        </Flex>
        </Flex>
        </Dialog.Content>
        </Dialog.Root>
        </>
    );
}
