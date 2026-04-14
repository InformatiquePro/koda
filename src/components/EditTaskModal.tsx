// src/components/EditTaskModal.tsx

import { useState, useEffect } from 'react';
import {
    Dialog, Flex, Text, TextField, TextArea,
    Select, Button, Switch,
} from '@radix-ui/themes';
import { useAppStore } from '../store/appStore';
import { Task, Column, Priority } from '../types/koda';

interface Props {
    task: Task;
}

export default function EditTaskModal({ task }: Props) {
    const { updateTask } = useAppStore();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? '');
    const [column, setColumn] = useState<Column>(task.column as Column);
    const [priority, setPriority] = useState<Priority>(task.priority as Priority);
    const [hasApi, setHasApi] = useState(task.hasApi);

    useEffect(() => {
        if (open) {
            setTitle(task.title);
            setDescription(task.description ?? '');
            setColumn(task.column as Column);
            setPriority(task.priority as Priority);
            setHasApi(task.hasApi);
        }
    }, [open, task]);

    function handleSave() {
        if (!title.trim()) return;
        updateTask({
            ...task,
            title: title.trim(),
                   description: description.trim() || undefined,
                   column,
                   priority,
                   hasApi,
                   updatedAt: new Date().toISOString(),
        });
        setOpen(false);
    }

    return (
        <>
        {/* Bouton déclencheur directement ici, sans Tooltip ni wrapper Dialog.Trigger */}
        <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen(true);
        }}
        style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}
        title="Modifier"
        >
        ✏️
        </button>

        <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content
        style={{
            background: 'rgba(20, 18, 40, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            maxWidth: 480,
        }}
        >
        <Dialog.Title>
        <Text size="5" weight="bold" style={{ color: 'var(--accent-9)' }}>
        ✏️ Modifier la tâche
        </Text>
        </Dialog.Title>

        <Flex direction="column" gap="4" mt="4">
        {/* Titre */}
        <Flex direction="column" gap="1">
        <Text size="2" color="gray">Titre *</Text>
        <TextField.Root
        size="3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
        />
        </Flex>

        {/* Description */}
        <Flex direction="column" gap="1">
        <Text size="2" color="gray">Description</Text>
        <TextArea
        size="2"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        />
        </Flex>

        {/* Colonne + Priorité */}
        <Flex gap="3">
        <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" color="gray">Colonne</Text>
        <Select.Root value={column} onValueChange={(v) => setColumn(v as Column)}>
        <Select.Trigger />
        <Select.Content>
        <Select.Item value="TODO">📋 À faire</Select.Item>
        <Select.Item value="IN_PROGRESS">⚡ En cours</Select.Item>
        <Select.Item value="BLOCKED">🔴 Bloqué</Select.Item>
        <Select.Item value="DONE">✅ Fini</Select.Item>
        </Select.Content>
        </Select.Root>
        </Flex>

        <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" color="gray">Priorité</Text>
        <Select.Root value={priority} onValueChange={(v) => setPriority(v as Priority)}>
        <Select.Trigger />
        <Select.Content>
        <Select.Item value="low">🟢 Faible</Select.Item>
        <Select.Item value="medium">🟡 Moyenne</Select.Item>
        <Select.Item value="high">🟠 Haute</Select.Item>
        <Select.Item value="urgent">🔴 Urgente</Select.Item>
        </Select.Content>
        </Select.Root>
        </Flex>
        </Flex>

        {/* Lié à une API */}
        <Flex align="center" justify="between">
        <Text size="2">Lié à une API externe</Text>
        <Switch checked={hasApi} onCheckedChange={setHasApi} />
        </Flex>

        {/* Boutons */}
        <Flex gap="2" justify="end" mt="2">
        <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
        Annuler
        </Button>
        <Button
        onClick={handleSave}
        disabled={!title.trim()}
        style={{ background: 'var(--accent-9)' }}
        >
        Sauvegarder
        </Button>
        </Flex>
        </Flex>
        </Dialog.Content>
        </Dialog.Root>
        </>
    );
}
