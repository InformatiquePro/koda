// src/components/KanbanBoard.tsx

import {
    DndContext,
    DragOverEvent,
    rectIntersection,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Box, Flex, Text, Badge, Button } from '@radix-ui/themes';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';
import { Task, Column } from '../types/koda';

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
    const { tasks, moveTask } = useAppStore();
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    function handleDragStart(event: DragStartEvent) {
        const task = tasks.find((t) => t.id === event.active.id);
        setActiveTask(task ?? null);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        // Si on survole une colonne directement
        const isColumn = COLUMNS.some((c) => c.id === overId);
        if (isColumn) {
            const currentTask = tasks.find((t) => t.id === taskId);
            if (currentTask && currentTask.column !== overId) {
                moveTask(taskId, overId as Column);
            }
            return;
        }

        // Si on survole une carte → prend sa colonne
        const overTask = tasks.find((t) => t.id === overId);
        const currentTask = tasks.find((t) => t.id === taskId);
        if (overTask && currentTask && overTask.column !== currentTask.column) {
            moveTask(taskId, overTask.column as Column);
        }
    }

    function handleDragEnd() {
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

        {/* Board */}
        <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        >
        <Flex gap="4" p="4" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t: Task) => t.column === col.id);
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
                <Text weight="bold" size="2" style={{ color: col.color }}>{col.label}</Text>
                </Flex>
                <Badge color="gray" variant="soft">{colTasks.length}</Badge>
                </Flex>

                {/* Zone droppable */}
                <SortableContext
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
                >
                <DroppableColumn id={col.id} color={col.color}>
                <Flex direction="column" gap="2">
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
        </Flex>
    );
}
