// src/components/BlockedReasonModal.tsx

import { useState } from 'react';
import { Dialog, Flex, Text, TextArea, Button, Badge } from '@radix-ui/themes';

interface Props {
    taskTitle: string;
    open: boolean;
    onConfirm: (reason: string) => void;
    onSkip: () => void;
}

export default function BlockedReasonModal({ taskTitle, open, onConfirm, onSkip }: Props) {
    const [reason, setReason] = useState('');

    function handleConfirm() {
        onConfirm(reason.trim());
        setReason('');
    }

    function handleSkip() {
        onSkip();
        setReason('');
    }

    return (
        <Dialog.Root open={open}>
        <Dialog.Content
        style={{
            background: 'rgba(20, 8, 8, 0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px',
            maxWidth: 420,
        }}
        >
        <Dialog.Title>
        <Flex align="center" gap="2">
        <Text size="4" weight="bold" style={{ color: '#ef4444' }}>
        🔴 Tâche bloquée
        </Text>
        <Badge color="red" variant="soft">BLOQUÉ</Badge>
        </Flex>
        </Dialog.Title>

        <Flex direction="column" gap="3" mt="3">
        <Text size="2" color="gray">
        Tâche : <Text weight="bold" style={{ color: '#fff' }}>{taskTitle}</Text>
        </Text>

        <Text size="2" color="gray">
        Quelle est la raison du blocage ? <Text size="1" color="gray">(facultatif)</Text>
        </Text>

        <TextArea
        size="2"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex: En attente d'une réponse client, dépendance externe..."
        rows={3}
        style={{ borderColor: 'rgba(239,68,68,0.3)' }}
        autoFocus
        />

        <Flex gap="2" justify="end" mt="1">
        <Button variant="soft" color="gray" onClick={handleSkip}>
        Passer
        </Button>
        <Button
        variant="solid"
        color="red"
        onClick={handleConfirm}
        >
        🔴 Confirmer le blocage
        </Button>
        </Flex>
        </Flex>
        </Dialog.Content>
        </Dialog.Root>
    );
}
