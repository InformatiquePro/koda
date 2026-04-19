// src/components/EditTaskModal.tsx

import { useState, useEffect } from 'react';
import {
    Dialog, Flex, Text, TextField, TextArea,
    Select, Button, Switch, Badge, IconButton,
    Box, Separator,
} from '@radix-ui/themes';
import { useAppStore } from '../store/appStore';
import { Task, Column, Priority, CustomAction, SubTask } from '../types/koda';
import { v4 as uuidv4 } from 'uuid';
import SubTaskEditor from './subtasks/SubTaskEditor';

interface Props {
    task: Task;
}

export default function EditTaskModal({ task }: Props) {
    const { updateTask } = useAppStore();
    const enableApiSupport    = useAppStore((s) => s.settings.enableApiSupport);
    const enableCustomActions = useAppStore((s) => s.settings.enableCustomActions);

    const [open, setOpen]               = useState(false);
    const [title, setTitle]             = useState(task.title);
    const [description, setDescription] = useState(task.description ?? '');
    const [column, setColumn]           = useState<Column>(task.column as Column);
    const [priority, setPriority]       = useState<Priority>(task.priority as Priority);
    const [hasApi, setHasApi]           = useState(task.hasApi);
    const [apiUrl, setApiUrl]           = useState(task.apiUrl ?? '');
    const [apiMethod, setApiMethod]     = useState(task.apiMethod ?? 'POST');
    const [customActions, setCustomActions] = useState<CustomAction[]>(task.customActions);
    const [subTasks, setSubTasks]       = useState<SubTask[]>(task.subTasks ?? []);

    useEffect(() => {
        if (open) {
            setTitle(task.title);
            setDescription(task.description ?? '');
            setColumn(task.column as Column);
            setPriority(task.priority as Priority);
            setHasApi(task.hasApi);
            setApiUrl(task.apiUrl ?? '');
            setApiMethod(task.apiMethod ?? 'POST');
            setCustomActions(task.customActions);
            setSubTasks(task.subTasks ?? []);
        }
    }, [open, task]);

    function handleSave() {
        if (!title.trim()) return;
        const updatedActions = customActions.map((a) => ({
            ...a,
            triggerColumn: column,
        }));
        updateTask({
            ...task,
            title:         title.trim(),
                   description:   description.trim() || undefined,
                   column,
                   priority,
                   hasApi,
                   apiUrl:        hasApi ? apiUrl.trim() : undefined,
                   apiMethod:     hasApi ? apiMethod : undefined,
                   customActions: updatedActions,
                   subTasks,                          // ← inclus ici
                   updatedAt:     new Date().toISOString(),
        });
        setOpen(false);
    }

    function addCustomAction() {
        const newAction: CustomAction = {
            id:            uuidv4(),
            label:         'Nouvelle action',
            triggerColumn: column,
            actionType:    'webhook',
            payload:       '',
        };
        setCustomActions((prev) => [...prev, newAction]);
    }

    function updateAction(id: string, field: keyof CustomAction, value: string) {
        setCustomActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
        );
    }

    function removeAction(id: string) {
        setCustomActions((prev) => prev.filter((a) => a.id !== id));
    }

    return (
        <>
        <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px', borderRadius: '4px',
            color: 'rgba(255,255,255,0.7)', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
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
            maxWidth: 520,
            maxHeight: '85vh',
            overflowY: 'auto',
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
        size="3" value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
        />
        </Flex>

        {/* Description */}
        <Flex direction="column" gap="1">
        <Text size="2" color="gray">Description</Text>
        <TextArea size="2" value={description}
        onChange={(e) => setDescription(e.target.value)} rows={3} />
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

        {/* ─── Sous-tâches ─── */}
        <Separator size="4" />
        <SubTaskEditor subTasks={subTasks} onChange={setSubTasks} />

        {/* ─── API ─── */}
        {enableApiSupport && (
            <>
            <Separator size="4" />
            <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
            <Text size="2" weight="bold" style={{ color: 'var(--accent-9)' }}>🔌 API</Text>
            <Switch size="1" checked={hasApi} onCheckedChange={setHasApi} />
            <Text size="1" color="gray">{hasApi ? 'Activée' : 'Désactivée'}</Text>
            </Flex>
            {hasApi && (
                <Flex direction="column" gap="2">
                <TextField.Root size="2" value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint" />
                <Select.Root value={apiMethod} onValueChange={setApiMethod}>
                <Select.Trigger />
                <Select.Content>
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                    <Select.Item key={m} value={m}>{m}</Select.Item>
                ))}
                </Select.Content>
                </Select.Root>
                </Flex>
            )}
            </Flex>
            </>
        )}

        {/* ─── Actions contextuelles ─── */}
        {enableCustomActions && (
            <>
            <Separator size="4" />
            <Flex direction="column" gap="2">
            <Text size="2" weight="bold" style={{ color: 'var(--accent-9)' }}>
            ⚡ Actions contextuelles
            </Text>
            <Box style={{ border: '1px solid var(--glass-border)', borderRadius: '10px', overflow: 'hidden' }}>
            <Flex align="center" justify="between" px="3" py="2"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Text size="2">⚡ Actions</Text>
            <Badge color="gray" size="1">{customActions.length}</Badge>
            </Flex>
            <Flex direction="column" gap="2" px="3" py="3"
            style={{ borderTop: '1px solid var(--glass-border)' }}>
            <Text size="1" color="gray" style={{ opacity: 0.7 }}>
            Ces boutons apparaissent sur la carte dans la colonne choisie.
            </Text>
            {customActions.map((action) => (
                <Flex key={action.id} direction="column" gap="2" p="2"
                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                <Flex gap="2" align="center">
                <TextField.Root size="1" value={action.label}
                onChange={(e) => updateAction(action.id, 'label', e.target.value)}
                placeholder="Label du bouton" style={{ flex: 1 }} />
                <IconButton size="1" variant="ghost" color="red"
                onClick={() => removeAction(action.id)}>✕</IconButton>
                </Flex>
                <Select.Root value={action.actionType}
                onValueChange={(v) => updateAction(action.id, 'actionType', v)}>
                <Select.Trigger />
                <Select.Content>
                <Select.Item value="webhook">🔗 Webhook</Select.Item>
                <Select.Item value="notify">🔔 Notification</Select.Item>
                <Select.Item value="archive">📦 Archiver</Select.Item>
                </Select.Content>
                </Select.Root>
                {action.actionType === 'webhook' && (
                    <TextField.Root size="1" value={action.payload ?? ''}
                    onChange={(e) => updateAction(action.id, 'payload', e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..." />
                )}
                </Flex>
            ))}
            <Button variant="soft" size="1" onClick={addCustomAction} style={{ marginTop: 4 }}>
            ＋ Ajouter une action
            </Button>
            </Flex>
            </Box>
            </Flex>
            </>
        )}

        {/* Boutons */}
        <Flex gap="2" justify="end" mt="2">
        <Button variant="soft" color="gray" onClick={() => setOpen(false)}>Annuler</Button>
        <Button onClick={handleSave} disabled={!title.trim()}
        style={{ background: 'var(--accent-9)' }}>
        Sauvegarder
        </Button>
        </Flex>

        </Flex>
        </Dialog.Content>
        </Dialog.Root>
        </>
    );
}
