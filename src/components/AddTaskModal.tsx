// src/components/AddTaskModal.tsx

import { useState } from 'react';
import {
    Dialog, Flex, Text, TextField, TextArea,
    Select, Button, Badge, Switch, IconButton,
    Box, Separator,
} from '@radix-ui/themes';
import { useAppStore } from '../store/appStore';
import { Column, Priority, CustomAction, SubTask } from '../types/koda';
import { v4 as uuidv4 } from 'uuid';
import SubTaskEditor from './subtasks/SubTaskEditor';

interface Props {
    defaultColumn?: Column;
    trigger: React.ReactNode;
}

export default function AddTaskModal({ defaultColumn = 'TODO', trigger }: Props) {
    const { addTask } = useAppStore();
    const enableApiSupport    = useAppStore((s) => s.settings.enableApiSupport);
    const enableCustomActions = useAppStore((s) => s.settings.enableCustomActions);

    const [open, setOpen]               = useState(false);
    const [title, setTitle]             = useState('');
    const [description, setDescription] = useState('');
    const [column, setColumn]           = useState<Column>(defaultColumn);
    const [priority, setPriority]       = useState<Priority>('medium');
    const [hasApi, setHasApi]           = useState(false);
    const [apiUrl, setApiUrl]           = useState('');
    const [apiMethod, setApiMethod]     = useState('POST');
    const [customActions, setCustomActions] = useState<CustomAction[]>([]);
    const [subTasks, setSubTasks]       = useState<SubTask[]>([]);

    function reset() {
        setTitle(''); setDescription('');
        setColumn(defaultColumn); setPriority('medium');
        setHasApi(false); setApiUrl(''); setApiMethod('POST');
        setCustomActions([]); setSubTasks([]);
    }

    function handleSubmit() {
        if (!title.trim()) return;
        addTask(title.trim(), column, description.trim(), priority, {
            hasApi,
            apiUrl:        hasApi ? apiUrl.trim() : undefined,
                apiMethod:     hasApi ? apiMethod : undefined,
                customActions,
                subTasks,                          // ← inclus ici
        });
        reset();
        setOpen(false);
    }

    function addCustomAction() {
        setCustomActions((prev) => [...prev, {
            id: uuidv4(), label: 'Nouvelle action',
                         triggerColumn: column, actionType: 'webhook', payload: '',
        }]);
    }

    function updateAction(id: string, field: keyof CustomAction, value: string) {
        setCustomActions((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
    }

    function removeAction(id: string) {
        setCustomActions((prev) => prev.filter((a) => a.id !== id));
    }

    return (
        <Dialog.Root open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <Dialog.Trigger>{trigger}</Dialog.Trigger>

        <Dialog.Content
        style={{
            background: 'rgba(20, 18, 40, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            maxWidth: 480,
            maxHeight: '85vh',
            overflowY: 'auto',
        }}
        >
        <Dialog.Title>
        <Text size="5" weight="bold" style={{ color: 'var(--accent-9)' }}>
        ➕ Nouvelle tâche
        </Text>
        </Dialog.Title>

        <Flex direction="column" gap="4" mt="4">

        <Flex direction="column" gap="1">
        <Text size="2" color="gray">Titre *</Text>
        <TextField.Root size="3"
        placeholder="Ex: Configurer le webhook Stripe..."
        value={title} onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} autoFocus />
        </Flex>

        <Flex direction="column" gap="1">
        <Text size="2" color="gray">Description</Text>
        <TextArea size="2" placeholder="Détails optionnels..."
        value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </Flex>

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

        <Flex align="center" gap="2">
        <Text size="1" color="gray">Aperçu :</Text>
        <Badge color={
            priority === 'low' ? 'gray' : priority === 'medium' ? 'yellow' :
            priority === 'high' ? 'orange' : 'red'
        } size="1">{priority}</Badge>
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

        <Flex gap="2" justify="end" mt="2">
        <Dialog.Close>
        <Button variant="soft" color="gray">Annuler</Button>
        </Dialog.Close>
        <Button onClick={handleSubmit} disabled={!title.trim()}
        style={{ background: 'var(--accent-9)' }}>
        Créer la tâche
        </Button>
        </Flex>

        </Flex>
        </Dialog.Content>
        </Dialog.Root>
    );
}
