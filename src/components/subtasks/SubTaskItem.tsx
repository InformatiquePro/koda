// src/components/subtasks/SubTaskItem.tsx

import { useState } from 'react';
import { Flex, Text, Dialog, Button, TextArea } from '@radix-ui/themes';
import { SubTask } from '../../types/koda';

interface Props {
    subTask: SubTask;
    isInProgress: boolean;
    onUpdate: (updated: SubTask) => void;
}

export default function SubTaskItem({ subTask, isInProgress, onUpdate }: Props) {
    const [blockedModalOpen, setBlockedModalOpen] = useState(false);
    const [blockedReason, setBlockedReason]       = useState('');

    const isDone    = subTask.status === 'done';
    const isBlocked = subTask.status === 'blocked';

    function handleDone() {
        if (!isInProgress) return;
        onUpdate({ ...subTask, status: isDone ? 'pending' : 'done', blockedReason: undefined });
    }

    function handleBlockedConfirm() {
        onUpdate({ ...subTask, status: 'blocked', blockedReason: blockedReason.trim() || undefined });
        setBlockedReason('');
        setBlockedModalOpen(false);
    }

    function handleUnblock() {
        onUpdate({ ...subTask, status: 'pending', blockedReason: undefined });
    }

    return (
        <>
        <Flex
        align="center"
        gap="2"
        px="2"
        py="1"
        style={{
            background: isBlocked
            ? 'rgba(239,68,68,0.07)'
            : isDone
            ? 'rgba(34,197,94,0.07)'
            : 'rgba(255,255,255,0.03)',
            borderRadius: 6,
            border: isBlocked
            ? '1px solid rgba(239,68,68,0.2)'
            : isDone
            ? '1px solid rgba(34,197,94,0.2)'
            : '1px solid rgba(255,255,255,0.06)',
        }}
        >
        {/* Bouton ✓ (valider) */}
        <button
        onClick={handleDone}
        disabled={!isInProgress || isBlocked}
        title={isInProgress ? (isDone ? 'Marquer en attente' : 'Marquer comme fait') : 'Disponible en colonne EN COURS'}
        style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: isDone ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
            background: isDone ? '#22c55e' : 'transparent',
            cursor: isInProgress && !isBlocked ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 10,
            color: '#fff',
            opacity: !isInProgress ? 0.4 : 1,
        }}
        >
        {isDone ? '✓' : ''}
        </button>

        {/* Label */}
        <Text
        size="1"
        style={{
            flex: 1,
            textDecoration: isDone ? 'line-through' : 'none',
            opacity: isDone ? 0.5 : 1,
            color: isBlocked ? '#ef4444' : undefined,
        }}
        >
        {subTask.label}
        </Text>

        {/* Raison du blocage */}
        {isBlocked && subTask.blockedReason && (
            <Text size="1" style={{ color: '#ef4444', opacity: 0.8, fontSize: 10 }}>
            {subTask.blockedReason}
            </Text>
        )}

        {/* Bouton 🔴 (bloquer) ou débloquer */}
        {isInProgress && (
            isBlocked ? (
                <button
                onClick={handleUnblock}
                title="Débloquer"
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: '#ef4444', padding: '0 2px',
                }}
                >
                ↩
                </button>
            ) : !isDone ? (
                <button
                onClick={() => setBlockedModalOpen(true)}
                title="Marquer comme bloquée"
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '0 2px',
                }}
                >
                🔴
                </button>
            ) : null
        )}
        </Flex>

        {/* Modale raison du blocage */}
        <Dialog.Root open={blockedModalOpen} onOpenChange={setBlockedModalOpen}>
        <Dialog.Content
        style={{
            background: 'rgba(20, 8, 8, 0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px',
            maxWidth: 380,
        }}
        >
        <Dialog.Title>
        <Text size="3" weight="bold" style={{ color: '#ef4444' }}>
        🔴 Bloquer la sous-tâche
        </Text>
        </Dialog.Title>

        <Flex direction="column" gap="3" mt="3">
        <Text size="2" color="gray">
        Sous-tâche : <Text weight="bold" style={{ color: '#fff' }}>{subTask.label}</Text>
        </Text>
        <Text size="2" color="gray">
        Raison du blocage ? <Text size="1" color="gray">(facultatif)</Text>
        </Text>
        <TextArea
        size="2"
        value={blockedReason}
        onChange={(e) => setBlockedReason(e.target.value)}
        placeholder="Ex: Matériel manquant, en attente de livraison..."
        rows={3}
        autoFocus
        />
        <Flex gap="2" justify="end">
        <Button variant="soft" color="gray" onClick={() => setBlockedModalOpen(false)}>
        Passer
        </Button>
        <Button variant="solid" color="red" onClick={handleBlockedConfirm}>
        🔴 Confirmer
        </Button>
        </Flex>
        </Flex>
        </Dialog.Content>
        </Dialog.Root>
        </>
    );
}
