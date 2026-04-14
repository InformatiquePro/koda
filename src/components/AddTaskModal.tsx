import { useState } from 'react';
import {
    Dialog,
    Flex,
    Text,
    TextField,
    TextArea,
    Select,
    Button,
    Badge,
} from '@radix-ui/themes';
import { useAppStore } from '../store/appStore';
import { Column, Priority } from '../types/koda';

interface Props {
    defaultColumn?: Column;
    trigger: React.ReactNode;
}

export default function AddTaskModal({ defaultColumn = 'TODO', trigger }: Props) {
    const { addTask } = useAppStore();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [column, setColumn] = useState<Column>(defaultColumn);
    const [priority, setPriority] = useState<Priority>('medium');

    function handleSubmit() {
        if (!title.trim()) return;
        addTask(title.trim(), column, description.trim(), priority);
        setTitle('');
        setDescription('');
        setPriority('medium');
        setOpen(false);
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger>{trigger}</Dialog.Trigger>

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
        ➕ Nouvelle tâche
        </Text>
        </Dialog.Title>

        <Flex direction="column" gap="4" mt="4">
        {/* Titre */}
        <Flex direction="column" gap="1">
        <Text size="2" color="gray">Titre *</Text>
        <TextField.Root
        size="3"
        placeholder="Ex: Configurer le webhook Stripe..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        autoFocus
        />
        </Flex>

        {/* Description */}
        <Flex direction="column" gap="1">
        <Text size="2" color="gray">Description</Text>
        <TextArea
        size="2"
        placeholder="Détails optionnels..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        />
        </Flex>

        {/* Colonne + Priorité côte à côte */}
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

        {/* Aperçu priorité */}
        <Flex align="center" gap="2">
        <Text size="1" color="gray">Aperçu :</Text>
        <Badge
        color={
            priority === 'low' ? 'gray' :
            priority === 'medium' ? 'yellow' :
            priority === 'high' ? 'orange' : 'red'
        }
        size="1"
        >
        {priority}
        </Badge>
        </Flex>

        {/* Boutons */}
        <Flex gap="2" justify="end" mt="2">
        <Dialog.Close>
        <Button variant="soft" color="gray">Annuler</Button>
        </Dialog.Close>
        <Button
        onClick={handleSubmit}
        disabled={!title.trim()}
        style={{ background: 'var(--accent-9)' }}
        >
        Créer la tâche
        </Button>
        </Flex>
        </Flex>
        </Dialog.Content>
        </Dialog.Root>
    );
}
