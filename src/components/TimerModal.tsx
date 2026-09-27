// src/components/TimerModal.tsx

import { useState } from 'react';
import { Dialog, Flex, Text, TextField, Select, Button } from '@radix-ui/themes';

interface Props {
    taskTitle: string;
    open: boolean;
    onStart: (seconds: number) => void;
    onSkip: () => void;
}

export default function TimerModal({ taskTitle, open, onStart, onSkip }: Props) {
    const [value, setValue] = useState('25');
    const [unit, setUnit] = useState('minutes');

    function handleStart() {
        const n = parseFloat(value);
        if (!n || n <= 0) return;
        const seconds =
        unit === 'secondes' ? n :
        unit === 'minutes'  ? n * 60 :
        unit === 'heures'   ? n * 3600 :
        n * 86400; // jours
        onStart(Math.floor(seconds));
    }

    return (
        <Dialog.Root open={open}>
        <Dialog.Content
        style={{
            background: 'rgba(20, 18, 40, 0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            maxWidth: 400,
        }}
        >
        <Dialog.Title>
        <Text size="4" weight="bold" style={{ color: 'var(--accent-9)' }}>
        ⏱️ Lancer un timer
        </Text>
        </Dialog.Title>

        <Flex direction="column" gap="3" mt="3">
        <Text size="2" color="gray">
        Tâche : <Text weight="bold" style={{ color: '#fff' }}>{taskTitle}</Text>
        </Text>

        <Text size="2" color="gray">
        Combien de temps t'accordes-tu pour cette tâche ?
        </Text>

        <Flex gap="2">
        <TextField.Root
        size="3"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ flex: 1 }}
        placeholder="25"
        />
        <Select.Root value={unit} onValueChange={setUnit}>
        <Select.Trigger style={{ minWidth: 120 }} />
        <Select.Content>
        <Select.Item value="secondes">Secondes</Select.Item>
        <Select.Item value="minutes">Minutes</Select.Item>
        <Select.Item value="heures">Heures</Select.Item>
        <Select.Item value="jours">Jours</Select.Item>
        </Select.Content>
        </Select.Root>
        </Flex>

        <Flex gap="2" justify="end" mt="2">
        <Button variant="soft" color="gray" onClick={onSkip}>
        Passer
        </Button>
        <Button
        onClick={handleStart}
        disabled={!value || parseFloat(value) <= 0}
        style={{ background: 'var(--accent-9)' }}
        >
        ▶ Démarrer
        </Button>
        </Flex>
        </Flex>
        </Dialog.Content>
        </Dialog.Root>
    );
}
