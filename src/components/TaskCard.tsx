// src/components/TaskCard.tsx

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Flex, Text, Badge, IconButton, Tooltip } from '@radix-ui/themes';
import { Task } from '../types/koda';
import { useAppStore } from '../store/appStore';
import { invoke } from '@tauri-apps/api/core';
import EditTaskModal from './EditTaskModal';

interface Props {
    task: Task;
    columnColor: string;
}

const PRIORITY_COLOR: Record<string, 'gray' | 'yellow' | 'orange' | 'red'> = {
    low: 'gray', medium: 'yellow', high: 'orange', urgent: 'red',
};

export default function TaskCard({ task, columnColor }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const { deleteTask } = useAppStore();

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const contextActions = task.customActions.filter(
        (a) => a.triggerColumn === task.column
    );

    async function runAction(actionType: string, payload?: string) {
        if (actionType === 'webhook' && payload) {
            await invoke('send_webhook', {
                url: payload,
                method: 'POST',
                body: JSON.stringify(task),
            });
        }
    }

    // Stoppe le drag sur tous les éléments interactifs
    function stopDrag(e: React.PointerEvent) {
        e.stopPropagation();
    }

    return (
        <div ref={setNodeRef} style={style}>
        <div
        style={{
            borderRadius: '12px',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            borderLeft: `3px solid ${columnColor}`,
            padding: '12px',
        }}
        >
        <Flex align="start" gap="2">

        {/* Poignée drag — SEULE zone qui déclenche le drag */}
        <div
        {...attributes}
        {...listeners}
        style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 16,
            paddingTop: 2,
            userSelect: 'none',
            flexShrink: 0,
            touchAction: 'none',
        }}
        >
        ⠿
        </div>

        <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 0 }}>

        {/* Titre + boutons action */}
        <Flex align="center" justify="between" gap="2">
        <Text size="2" weight="medium" style={{ wordBreak: 'break-word' }}>
        {task.title}
        </Text>

        <Flex gap="1" style={{ flexShrink: 0 }}>
        {/* Bouton éditer - géré dans EditTaskModal */}
        <div onPointerDown={stopDrag}>
        <EditTaskModal task={task} />
        </div>

        {/* Bouton supprimer */}
        <div onPointerDown={stopDrag}>
        <Tooltip content="Supprimer">
        <IconButton
        size="1"
        variant="ghost"
        color="red"
        onClick={() => deleteTask(task.id)}
        >
        ✕
        </IconButton>
        </Tooltip>
        </div>
        </Flex>
        </Flex>

        {/* Badges priorité + API + pièces jointes */}
        <Flex gap="1" wrap="wrap">
        <Badge color={PRIORITY_COLOR[task.priority]} size="1">
        {task.priority}
        </Badge>
        {task.hasApi && <Badge color="blue" size="1">API</Badge>}
        {task.attachments.length > 0 && (
            <Badge color="gray" variant="outline" size="1">
            📎 {task.attachments.length}
            </Badge>
        )}
        </Flex>

        {/* Description */}
        {task.description && (
            <Text size="1" style={{ opacity: 0.6, wordBreak: 'break-word' }}>
            {task.description.slice(0, 100)}
            {task.description.length > 100 ? '…' : ''}
            </Text>
        )}

        {/* Actions contextuelles */}
        {contextActions.length > 0 && (
            <Flex gap="1" wrap="wrap">
            {contextActions.map((action) => (
                <div key={action.id} onPointerDown={stopDrag}>
                <Badge
                color="violet"
                variant="soft"
                style={{ cursor: 'pointer' }}
                onClick={() => runAction(action.actionType, action.payload)}
                >
                {action.label}
                </Badge>
                </div>
            ))}
            </Flex>
        )}

        </Flex>
        </Flex>
        </div>
        </div>
    );
}
