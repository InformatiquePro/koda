// src/components/TaskCard.tsx

import TimerBadge from './TimerBadge';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Flex, Text, Badge, IconButton, Tooltip, Callout } from '@radix-ui/themes';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { invoke } from '@tauri-apps/api/core';
import { Task } from '../types/koda';
import { useAppStore } from '../store/appStore';
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
        attributes, listeners, setNodeRef,
        transform, transition, isDragging,
    } = useSortable({ id: task.id });

    const { deleteTask } = useAppStore();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    // Toutes les actions s'affichent — elles suivent la colonne auto
    const contextActions = task.customActions;

    function showFeedback(ok: boolean, msg: string) {
        setFeedback({ ok, msg });
        setTimeout(() => setFeedback(null), 3000);
    }

    async function runAction(actionType: string, payload?: string) {
        if (actionType === 'webhook') {
            if (!payload) {
                showFeedback(false, 'URL webhook manquante');
                return;
            }
            try {
                const result = await invoke<string>('send_webhook', {
                    url: payload,
                    method: 'POST',
                    body: JSON.stringify(task),
                });
                showFeedback(true, `Webhook envoyé — ${result}`);
            } catch (e) {
                showFeedback(false, `Erreur : ${e}`);
            }
            return;
        }

        if (actionType === 'notify') {
            try {
                await sendNotification({
                    title: 'Koda',
                    body: `Action sur : ${task.title}`,
                });
                showFeedback(true, 'Notification envoyée');
            } catch (e) {
                showFeedback(false, `Erreur notification : ${e}`);
            }
            return;
        }

        if (actionType === 'archive') {
            // Confirmation inline sans alert()
            showFeedback(false, 'Clique à nouveau pour confirmer la suppression');
            setTimeout(() => deleteTask(task.id), 2000);
            return;
        }
    }

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

        {/* Poignée drag */}
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

        {/* Titre + boutons */}
        <Flex align="center" justify="between" gap="2">
        <Text size="2" weight="medium" style={{ wordBreak: 'break-word' }}>
        {task.title}
        </Text>
        <Flex gap="1" style={{ flexShrink: 0 }}>
        <div onPointerDown={stopDrag}>
        <EditTaskModal task={task} />
        </div>
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

        {/* Badges */}
        <Flex gap="1" wrap="wrap">
        <Badge color={PRIORITY_COLOR[task.priority]} size="1">{task.priority}</Badge>
        {task.hasApi && <Badge color="blue" size="1">API</Badge>}
        {task.attachments.length > 0 && (
            <Badge color="gray" variant="outline" size="1">
            📎 {task.attachments.length}
            </Badge>
        )}
        </Flex>

        {/* Timer actif */}
        {task.pomodoroStartedAt && task.pomodoroDuration && (
            <TimerBadge
            startedAt={task.pomodoroStartedAt}
            durationSeconds={task.pomodoroDuration}
            />
        )}

        {/* Description */}
        {task.description && (
            <Text size="1" style={{ opacity: 0.6, wordBreak: 'break-word' }}>
            {task.description.slice(0, 100)}
            {task.description.length > 100 ? '…' : ''}
            </Text>
        )}

        {/* Feedback inline après action */}
        {feedback && (
            <Callout.Root
            color={feedback.ok ? 'green' : 'red'}
            size="1"
            style={{ padding: '4px 8px' }}
            >
            <Callout.Text>{feedback.ok ? '✅' : '⚠️'} {feedback.msg}</Callout.Text>
            </Callout.Root>
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
