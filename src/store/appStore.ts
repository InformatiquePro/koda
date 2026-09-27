import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { AppSettings, Column, CustomAction, Priority, SubTask, Task } from '../types/koda';

interface TaskExtras {
    hasApi?: boolean;
    apiUrl?: string;
    apiMethod?: string;
    customActions?: CustomAction[];
    subTasks?: SubTask[];
}

interface AppStore {
    tasks: Task[];
    settings: AppSettings;
    sidebarOpen: boolean;
    pendingTimerTaskId: string | null;
    pendingBlockedTaskId: string | null;
    fetchTasks: () => Promise<void>;
    fetchSettings: () => Promise<void>;
    addTask: (title: string, column?: Column, description?: string, priority?: Priority, extras?: TaskExtras) => void;
    deleteTask: (id: string) => void;
    moveTask: (taskId: string, newColumn: Column, promptTransition?: boolean) => void;
    updateTask: (task: Task) => void;
    updateSettings: (partial: Partial<AppSettings>) => void;
    toggleSidebar: () => void;
    importTasks: (newTasks: Task[], broadcast?: boolean) => void;
    setPendingTimerTaskId: (id: string | null) => void;
    startTimer: (taskId: string, seconds: number) => void;
    stopTimer: (taskId: string) => void;
    setPendingBlockedTaskId: (id: string | null) => void;
    confirmBlocked: (taskId: string, reason: string) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
    kioskMode: false,
    lowBrightnessKiosk: true,
    weatherApiKey: undefined,
    weatherCity: 'Quimper',
    weatherCityId: undefined,
    theme: 'dark',
    enableApiSupport: false,
    enableCustomActions: false,
    globalCommandShortcut: false,
};

const COLUMNS: Column[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

function normalizeTask(value: Task): Task {
    const now = new Date().toISOString();
    const column = COLUMNS.includes(value.column) ? value.column : 'TODO';
    const priority = PRIORITIES.includes(value.priority) ? value.priority : 'medium';

    return {
        ...value,
        id: value.id || uuidv4(),
        title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : 'Tâche sans titre',
        column,
        priority,
        tags: Array.isArray(value.tags) ? value.tags : [],
        hasApi: Boolean(value.hasApi),
        attachments: Array.isArray(value.attachments) ? value.attachments : [],
        customActions: Array.isArray(value.customActions) ? value.customActions : [],
        subTasks: Array.isArray(value.subTasks) ? value.subTasks : [],
        createdAt: value.createdAt || now,
        updatedAt: value.updatedAt || now,
    };
}

function syncServer(tasks: Task[]) {
    invoke('sync_tasks_to_server', { tasks }).catch(() => {});
}

function persistTask(task: Task) {
    invoke('save_task', { task }).catch(console.error);
}

export const useAppStore = create<AppStore>((set, get) => ({
    tasks: [],
    settings: DEFAULT_SETTINGS,
    sidebarOpen: true,
    pendingTimerTaskId: null,
    pendingBlockedTaskId: null,

    fetchTasks: async () => {
        try {
            const tasks = await invoke<Task[]>('get_tasks');
            set({ tasks: tasks.map(normalizeTask) });
        } catch (error) {
            console.error('Chargement des tâches impossible :', error);
        }
    },

    fetchSettings: async () => {
        try {
            const settings = await invoke<AppSettings>('get_settings');
            set({ settings: { ...DEFAULT_SETTINGS, ...settings } });
        } catch (error) {
            console.error('Chargement des paramètres impossible :', error);
        }
    },

    addTask: (title, column = 'TODO', description = '', priority = 'medium', extras = {}) => {
        const now = new Date().toISOString();
        const newTask: Task = {
            id: uuidv4(),
            title: title.trim(),
            description: description.trim() || undefined,
            column,
            priority,
            tags: [],
            hasApi: extras.hasApi ?? false,
            apiUrl: extras.apiUrl,
            apiMethod: extras.apiMethod,
            customActions: extras.customActions ?? [],
            subTasks: extras.subTasks ?? [],
            attachments: [],
            createdAt: now,
            updatedAt: now,
        };

        set((state) => {
            const tasks = [...state.tasks, newTask];
            syncServer(tasks);
            return {
                tasks,
                pendingTimerTaskId: column === 'IN_PROGRESS' ? newTask.id : state.pendingTimerTaskId,
                pendingBlockedTaskId: column === 'BLOCKED' ? newTask.id : state.pendingBlockedTaskId,
            };
        });
        persistTask(newTask);
    },

    deleteTask: (id) => {
        set((state) => {
            const tasks = state.tasks.filter((task) => task.id !== id);
            syncServer(tasks);
            return {
                tasks,
                pendingTimerTaskId: state.pendingTimerTaskId === id ? null : state.pendingTimerTaskId,
                pendingBlockedTaskId: state.pendingBlockedTaskId === id ? null : state.pendingBlockedTaskId,
            };
        });
        invoke('delete_task', { id }).catch(console.error);
    },

    moveTask: (taskId, newColumn, promptTransition = true) => {
        let changedTask: Task | undefined;
        let previousColumn: Column | undefined;

        set((state) => {
            const tasks = state.tasks.map((task) => {
                if (task.id !== taskId || task.column === newColumn) return task;
                previousColumn = task.column;
                changedTask = {
                    ...task,
                    column: newColumn,
                    blockedReason: newColumn === 'BLOCKED' ? task.blockedReason : undefined,
                    pomodoroDuration: newColumn === 'BLOCKED' || newColumn === 'DONE' ? undefined : task.pomodoroDuration,
                    pomodoroStartedAt: newColumn === 'BLOCKED' || newColumn === 'DONE' ? undefined : task.pomodoroStartedAt,
                    updatedAt: new Date().toISOString(),
                };
                return changedTask;
            });

            if (!changedTask) return state;
            syncServer(tasks);
            return {
                tasks,
                pendingTimerTaskId: promptTransition && newColumn === 'IN_PROGRESS' && previousColumn !== 'IN_PROGRESS'
                    ? taskId
                    : state.pendingTimerTaskId,
                pendingBlockedTaskId: promptTransition && newColumn === 'BLOCKED' && previousColumn !== 'BLOCKED'
                    ? taskId
                    : state.pendingBlockedTaskId,
            };
        });

        if (changedTask) persistTask(changedTask);
    },

    updateTask: (task) => {
        const previous = get().tasks.find((item) => item.id === task.id);
        const columnChanged = Boolean(previous && previous.column !== task.column);
        const updated = normalizeTask({
            ...task,
            blockedReason: task.column === 'BLOCKED' ? task.blockedReason : undefined,
            pomodoroDuration: task.column === 'BLOCKED' || task.column === 'DONE' ? undefined : task.pomodoroDuration,
            pomodoroStartedAt: task.column === 'BLOCKED' || task.column === 'DONE' ? undefined : task.pomodoroStartedAt,
            updatedAt: new Date().toISOString(),
        });

        set((state) => {
            const tasks = state.tasks.map((item) => item.id === updated.id ? updated : item);
            syncServer(tasks);
            return {
                tasks,
                pendingTimerTaskId: columnChanged && updated.column === 'IN_PROGRESS'
                    ? updated.id
                    : state.pendingTimerTaskId,
                pendingBlockedTaskId: columnChanged && updated.column === 'BLOCKED'
                    ? updated.id
                    : state.pendingBlockedTaskId,
            };
        });
        persistTask(updated);
    },

    updateSettings: (partial) => {
        const settings = { ...get().settings, ...partial };
        set({ settings });
        invoke('save_settings', { settings }).catch(console.error);
    },

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setPendingTimerTaskId: (id) => set({ pendingTimerTaskId: id }),
    setPendingBlockedTaskId: (id) => set({ pendingBlockedTaskId: id }),

    startTimer: (taskId, seconds) => {
        let updated: Task | undefined;
        set((state) => {
            const tasks = state.tasks.map((task) => {
                if (task.id !== taskId) return task;
                updated = {
                    ...task,
                    pomodoroDuration: seconds,
                    pomodoroStartedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                return updated;
            });
            syncServer(tasks);
            return { tasks, pendingTimerTaskId: null };
        });
        if (updated) persistTask(updated);
    },

    stopTimer: (taskId) => {
        let updated: Task | undefined;
        set((state) => {
            const tasks = state.tasks.map((task) => {
                if (task.id !== taskId) return task;
                updated = {
                    ...task,
                    pomodoroDuration: undefined,
                    pomodoroStartedAt: undefined,
                    updatedAt: new Date().toISOString(),
                };
                return updated;
            });
            syncServer(tasks);
            return { tasks };
        });
        if (updated) persistTask(updated);
    },

    confirmBlocked: (taskId, reason) => {
        let updated: Task | undefined;
        set((state) => {
            const tasks = state.tasks.map((task) => {
                if (task.id !== taskId) return task;
                updated = {
                    ...task,
                    blockedReason: reason.trim() || undefined,
                    updatedAt: new Date().toISOString(),
                };
                return updated;
            });
            syncServer(tasks);
            return { tasks, pendingBlockedTaskId: null };
        });
        if (updated) persistTask(updated);
    },

    importTasks: (newTasks, broadcast = true) => {
        const incomingTasks = newTasks.map(normalizeTask);
        const currentTasks = get().tasks;

        // Le WebSocket transmet un instantané complet. Dans ce cas, il faut
        // aussi répercuter les suppressions faites depuis l'interface web.
        if (!broadcast) {
            const incomingIds = new Set(incomingTasks.map((task) => task.id));
            const removedIds = currentTasks
                .filter((task) => !incomingIds.has(task.id))
                .map((task) => task.id);

            set({ tasks: incomingTasks });
            incomingTasks.forEach(persistTask);
            removedIds.forEach((id) => invoke('delete_task', { id }).catch(console.error));
            return;
        }

        const incomingById = new Map(incomingTasks.map((task) => [task.id, task]));
        const currentIds = new Set(currentTasks.map((task) => task.id));

        const merged = currentTasks.map((existing) => {
            const incoming = incomingById.get(existing.id);
            if (!incoming) return existing;
            return new Date(incoming.updatedAt).getTime() > new Date(existing.updatedAt).getTime()
                ? incoming
                : existing;
        });
        const added = incomingTasks.filter((task) => !currentIds.has(task.id));
        const tasks = [...merged, ...added];

        set({ tasks });
        if (broadcast) syncServer(tasks);
        tasks.forEach(persistTask);
    },
}));
