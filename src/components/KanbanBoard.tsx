// src/components/KanbanBoard.tsx

import { useRef, useState } from 'react';
import {
    DndContext,
    DragOverEvent,
    DragStartEvent,
    rectIntersection,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Box, Flex, Text, Badge, Button, Dialog, TextField } from '@radix-ui/themes';
import { useAppStore } from '../store/appStore';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';
import { Task, Column } from '../types/koda';
import { addDays, formatDay, toDateKey, todayKey } from '../utils/dates';

const COLUMNS: { id: Column; label: string; color: string }[] = [
    { id: 'TODO',        label: 'À FAIRE',  color: 'var(--col-todo)' },
    { id: 'IN_PROGRESS', label: 'EN COURS', color: 'var(--col-inprogress)' },
    { id: 'BLOCKED',     label: 'BLOQUÉ',   color: 'var(--col-blocked)' },
    { id: 'DONE',        label: 'FINI',     color: 'var(--col-done)' },
];

function DroppableColumn({ id, color, children }: { id: string; color: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
        ref={setNodeRef}
        style={{
            flex: 1,
            minHeight: 120,
            borderRadius: 8,
            transition: 'background 0.15s, box-shadow 0.15s',
            background: isOver ? `${color}18` : 'transparent',
            boxShadow: isOver ? `inset 0 0 0 2px ${color}60` : 'none',
            padding: 4,
        }}
        >
        {children}
        </div>
    );
}

export default function KanbanBoard() {
    const {
        tasks, settings, moveTask, setPendingTimerTaskId, setPendingBlockedTaskId,
        syncCalendar, agendaSyncing,
    } = useAppStore();
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [selectedDay, setSelectedDay] = useState(todayKey());
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [showOverdueTasks, setShowOverdueTasks] = useState(false);
    const [doneHistoryOpen, setDoneHistoryOpen] = useState(false);
    const [doneHistoryDay, setDoneHistoryDay] = useState(todayKey());
    const originalColumnRef = useRef<Column | null>(null);
    const finalColumnRef = useRef<Column | null>(null);
    const draggedTaskIdRef = useRef<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    async function handleSync() {
        setSyncMessage(null);
        try {
            const count = await syncCalendar();
            setSyncMessage(`${count} événement${count > 1 ? 's' : ''}`);
        } catch {
            setSyncMessage('Échec de la synchronisation');
        }
    }

    function tasksForColumn(column: Column): Task[] {
        return tasks
            .filter((task) => task.column === column)
            .filter((task) => {
                if (!settings.agendaEnabled) return true;
                if (column === 'TODO' && task.scheduledFor) {
                    const taskDay = toDateKey(task.scheduledFor);
                    return taskDay === selectedDay || (showOverdueTasks && taskDay !== null && taskDay < todayKey());
                }
                if (column === 'DONE') {
                    return toDateKey(task.completedAt ?? task.updatedAt) === selectedDay;
                }
                return true;
            })
            .sort((left, right) => {
                if (column === 'TODO') {
                    if (!left.scheduledFor) return 1;
                    if (!right.scheduledFor) return -1;
                    return left.scheduledFor.localeCompare(right.scheduledFor);
                }
                if (column === 'DONE') {
                    return (right.completedAt ?? right.updatedAt).localeCompare(left.completedAt ?? left.updatedAt);
                }
                return right.updatedAt.localeCompare(left.updatedAt);
            });
    }

    const overdueAgendaTasks = tasks.filter((task) => {
        const taskDay = toDateKey(task.scheduledFor);
        return task.column === 'TODO' && taskDay !== null && taskDay < todayKey();
    });
    const doneHistoryTasks = tasks
        .filter((task) => task.column === 'DONE')
        .filter((task) => toDateKey(task.completedAt ?? task.updatedAt) === doneHistoryDay)
        .sort((left, right) => (right.completedAt ?? right.updatedAt).localeCompare(left.completedAt ?? left.updatedAt));

    function handleDragStart(event: DragStartEvent) {
        const task = tasks.find((t) => t.id === event.active.id);
        setActiveTask(task ?? null);
        draggedTaskIdRef.current = event.active.id as string;
        originalColumnRef.current = task?.column ?? null;
        finalColumnRef.current = task?.column ?? null;
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        const isColumn = COLUMNS.some((c) => c.id === overId);
        if (isColumn) {
            const currentTask = tasks.find((t) => t.id === taskId);
            if (currentTask && currentTask.column !== overId) {
                finalColumnRef.current = overId as Column;
                moveTask(taskId, overId as Column, false);
            }
            return;
        }

        const overTask = tasks.find((t) => t.id === overId);
        const currentTask = tasks.find((t) => t.id === taskId);
        if (overTask && currentTask && overTask.column !== currentTask.column) {
            finalColumnRef.current = overTask.column as Column;
            moveTask(taskId, overTask.column as Column, false);
        }
    }

    function handleDragEnd() {
        const taskId = draggedTaskIdRef.current;
        const originalColumn = originalColumnRef.current;
        const finalColumn = finalColumnRef.current;
        if (taskId && originalColumn !== finalColumn) {
            if (finalColumn === 'IN_PROGRESS') setPendingTimerTaskId(taskId);
            if (finalColumn === 'BLOCKED') setPendingBlockedTaskId(taskId);
        }
        draggedTaskIdRef.current = null;
        originalColumnRef.current = null;
        finalColumnRef.current = null;
        setActiveTask(null);
    }

    function handleDragCancel() {
        const taskId = draggedTaskIdRef.current;
        const originalColumn = originalColumnRef.current;
        if (taskId && originalColumn) moveTask(taskId, originalColumn, false);
        draggedTaskIdRef.current = null;
        originalColumnRef.current = null;
        finalColumnRef.current = null;
        setActiveTask(null);
    }

    return (
        <Flex direction="column" style={{ flex: 1, height: '100vh', overflow: 'hidden' }}>

        {/* Barre du haut */}
        <Flex
        align="center"
        justify="between"
        px="4"
        py="3"
        style={{ borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}
        >
        <Text size="5" weight="bold" style={{ color: 'var(--accent-9)' }}>
        ⚡ Koda
        </Text>
        <AddTaskModal
        trigger={
            <Button size="3" style={{ background: 'var(--accent-9)', cursor: 'pointer' }}>
            ➕ Nouvelle tâche
            </Button>
        }
        />
        </Flex>

        {settings.agendaEnabled && (
            <Flex
            align="center"
            justify="between"
            gap="3"
            px="4"
            py="2"
            wrap="wrap"
            style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(99,102,241,0.08)' }}
            >
            <Flex align="center" gap="2">
            <Button size="1" variant="soft" onClick={() => setSelectedDay(addDays(selectedDay, -1))}>← Jour précédent</Button>
            <Button size="1" variant="outline" onClick={() => setSelectedDay(todayKey())}>Aujourd’hui</Button>
            <Button size="1" variant="soft" onClick={() => setSelectedDay(addDays(selectedDay, 1))}>Jour suivant →</Button>
            </Flex>
            <Text size="2" weight="bold" style={{ textTransform: 'capitalize', color: '#c4b5fd' }}>
            📅 {formatDay(selectedDay)}
            </Text>
            <Flex align="center" gap="2">
            {syncMessage && <Text size="1" color="gray">{syncMessage}</Text>}
            <Button size="1" color="violet" disabled={agendaSyncing} onClick={() => void handleSync()}>
            {agendaSyncing ? 'Synchronisation…' : '↻ Synchroniser'}
            </Button>
            </Flex>
            </Flex>
        )}

        {/* Board */}
        <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        >
        <Flex gap="4" p="4" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        {COLUMNS.map((col) => {
            const colTasks = tasksForColumn(col.id);
            return (
                <Box
                key={col.id}
                style={{
                    minWidth: '280px',
                    flex: 1,
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '100%',
                    overflowY: 'auto',
                }}
                >
                {/* En-tête */}
                <Flex align="center" justify="between" mb="3" style={{ flexShrink: 0 }}>
                <Flex align="center" gap="2">
                <Box style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                <Flex direction="column" gap="1">
                <Text weight="bold" size="2" style={{ color: col.color }}>{col.label}</Text>
                {settings.agendaEnabled && (col.id === 'TODO' || col.id === 'DONE') && (
                    <Text size="1" color="gray" style={{ textTransform: 'capitalize' }}>
                    {col.id === 'TODO' ? 'Prévu' : 'Terminé'} · {formatDay(selectedDay, 'short')}
                    </Text>
                )}
                </Flex>
                </Flex>
                <Badge color="gray" variant="soft">{colTasks.length}</Badge>
                </Flex>

                {settings.agendaEnabled && col.id === 'TODO' && overdueAgendaTasks.length > 0 && (
                    <Button
                    size="1"
                    variant={showOverdueTasks ? 'solid' : 'soft'}
                    color="orange"
                    mb="2"
                    onClick={() => setShowOverdueTasks((visible) => !visible)}
                    >
                    {showOverdueTasks
                        ? 'Masquer les tâches précédentes'
                        : `Afficher tâches jours précédents non faites (${overdueAgendaTasks.length})`}
                    </Button>
                )}

                {settings.agendaEnabled && col.id === 'DONE' && (
                    <Button
                    size="1"
                    variant="soft"
                    color="green"
                    mb="2"
                    onClick={() => setDoneHistoryOpen(true)}
                    >
                    Voir tâches terminées d’un autre jour
                    </Button>
                )}

                {/* Zone droppable */}
                <SortableContext
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
                >
                <DroppableColumn id={col.id} color={col.color}>
                <Flex direction="column" gap="2">
                {colTasks.length === 0 && settings.agendaEnabled && (col.id === 'TODO' || col.id === 'DONE') && (
                    <Text size="1" color="gray" align="center" style={{ padding: '16px 0' }}>
                    Rien pour ce jour.
                    </Text>
                )}
                {colTasks.map((task: Task) => (
                    <TaskCard key={task.id} task={task} columnColor={col.color} />
                ))}
                </Flex>
                </DroppableColumn>
                </SortableContext>

                {/* Bouton ajouter */}
                <Box mt="2" style={{ flexShrink: 0 }}>
                <AddTaskModal
                defaultColumn={col.id}
                trigger={
                    <Button
                    variant="ghost"
                    size="1"
                    style={{
                        width: '100%',
                        cursor: 'pointer',
                        color: col.color,
                        border: `1px dashed ${col.color}40`,
                        borderRadius: '8px',
                    }}
                    >
                    ＋ Ajouter ici
                    </Button>
                }
                />
                </Box>
                </Box>
            );
        })}
        </Flex>

        {/* Carte fantôme pendant le drag */}
        <DragOverlay>
        {activeTask ? (
            <div style={{ opacity: 0.85, transform: 'rotate(2deg)' }}>
            <TaskCard task={activeTask} columnColor="var(--accent-9)" />
            </div>
        ) : null}
        </DragOverlay>

        </DndContext>

        <Dialog.Root open={doneHistoryOpen} onOpenChange={setDoneHistoryOpen}>
        <Dialog.Content maxWidth="520px">
        <Dialog.Title>Tâches terminées</Dialog.Title>
        <Dialog.Description>
        Choisis une date pour consulter les tâches finalisées ce jour-là.
        </Dialog.Description>
        <Flex direction="column" gap="3" mt="4">
        <TextField.Root
        type="date"
        value={doneHistoryDay}
        onChange={(event) => setDoneHistoryDay(event.target.value)}
        />
        <Text size="2" color="gray" style={{ textTransform: 'capitalize' }}>
        {formatDay(doneHistoryDay)} · {doneHistoryTasks.length} tâche{doneHistoryTasks.length > 1 ? 's' : ''}
        </Text>
        <Flex direction="column" gap="2" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
        {doneHistoryTasks.length === 0 ? (
            <Text size="2" color="gray" align="center" style={{ padding: '24px 0' }}>
            Aucune tâche terminée ce jour-là.
            </Text>
        ) : doneHistoryTasks.map((task) => (
            <Box key={task.id} p="3" style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 8 }}>
            <Text size="2" weight="bold">✓ {task.title}</Text>
            {task.scheduledFor && <Text size="1" color="gray" as="div">Prévu : {formatDay(toDateKey(task.scheduledFor) ?? doneHistoryDay, 'short')}</Text>}
            </Box>
        ))}
        </Flex>
        <Flex justify="end">
        <Button variant="soft" color="gray" onClick={() => setDoneHistoryOpen(false)}>Fermer</Button>
        </Flex>
        </Flex>
        </Dialog.Content>
        </Dialog.Root>
        </Flex>
    );
}
