// src/components/subtasks/SubTaskEditor.tsx

import { useState } from 'react';
import { Flex, Text, TextField, Button, IconButton, Badge } from '@radix-ui/themes';
import { SubTask } from '../../types/koda';
import { v4 as uuidv4 } from 'uuid';

interface Props {
    subTasks: SubTask[];
    onChange: (subTasks: SubTask[]) => void;
}

export default function SubTaskEditor({ subTasks, onChange }: Props) {
    const [newLabel, setNewLabel] = useState('');

    function addSubTask() {
        if (!newLabel.trim()) return;
        onChange([
            ...subTasks,
            { id: uuidv4(), label: newLabel.trim(), status: 'pending' },
        ]);
        setNewLabel('');
    }

    function removeSubTask(id: string) {
        onChange(subTasks.filter((s) => s.id !== id));
    }

    function updateLabel(id: string, label: string) {
        onChange(subTasks.map((s) => (s.id === id ? { ...s, label } : s)));
    }

    return (
        <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
        <Text size="2" weight="bold" style={{ color: 'var(--accent-9)' }}>
        📋 Sous-tâches
        </Text>
        {subTasks.length > 0 && (
            <Badge color="gray" size="1">{subTasks.length}</Badge>
        )}
        </Flex>

        {/* Liste éditable */}
        {subTasks.map((sub) => (
            <Flex key={sub.id} align="center" gap="2">
            <Text size="1" color="gray" style={{ flexShrink: 0 }}>•</Text>
            <TextField.Root
            size="1"
            value={sub.label}
            onChange={(e) => updateLabel(sub.id, e.target.value)}
            style={{ flex: 1 }}
            />
            <IconButton
            size="1"
            variant="ghost"
            color="red"
            onClick={() => removeSubTask(sub.id)}
            >
            ✕
            </IconButton>
            </Flex>
        ))}

        {/* Ajouter une sous-tâche */}
        <Flex gap="2">
        <TextField.Root
        size="1"
        placeholder="Ex: Ordi 10-A, Ordi 10-B..."
        value={newLabel}
        onChange={(e) => setNewLabel(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
        style={{ flex: 1 }}
        />
        <Button size="1" variant="soft" onClick={addSubTask} disabled={!newLabel.trim()}>
        ＋
        </Button>
        </Flex>
        </Flex>
    );
}
