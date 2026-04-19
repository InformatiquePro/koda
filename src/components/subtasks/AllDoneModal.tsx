// src/components/subtasks/AllDoneModal.tsx

import { Dialog, Flex, Text, Button } from '@radix-ui/themes';

interface Props {
    open: boolean;
    taskTitle: string;
    onMoveToDone: () => void;
    onStay: () => void;
}

export default function AllDoneModal({ open, taskTitle, onMoveToDone, onStay }: Props) {
    return (
        <Dialog.Root open={open}>
        <Dialog.Content
        style={{
            background: 'rgba(8, 20, 10, 0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '16px',
            maxWidth: 400,
        }}
        >
        <Dialog.Title>
        <Text size="4" weight="bold" style={{ color: '#22c55e' }}>
        🎉 Toutes les sous-tâches sont terminées !
        </Text>
        </Dialog.Title>

        <Flex direction="column" gap="3" mt="3">
        <Text size="2" color="gray">
        Tâche : <Text weight="bold" style={{ color: '#fff' }}>{taskTitle}</Text>
        </Text>
        <Text size="2" color="gray">
        Toutes les sous-tâches ont été complétées. Déplacer la tâche dans{' '}
        <Text weight="bold" style={{ color: '#22c55e' }}>FINI</Text> ?
        </Text>

        <Flex gap="2" justify="end" mt="1">
        <Button variant="soft" color="gray" onClick={onStay}>
        Rester en cours
        </Button>
        <Button variant="solid" color="green" onClick={onMoveToDone}>
        ✅ Déplacer dans FINI
        </Button>
        </Flex>
        </Flex>
        </Dialog.Content>
        </Dialog.Root>
    );
}
