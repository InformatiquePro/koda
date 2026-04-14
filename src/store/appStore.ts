import { create } from 'zustand';
import { Task, AppSettings, Column, Priority } from '../types/koda';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';

interface AppStore {
    tasks: Task[];
    settings: AppSettings;
    sidebarOpen: boolean;
    fetchTasks: () => Promise<void>;
    addTask: (title: string, column?: Column, description?: string, priority?: Priority) => void;
    deleteTask: (id: string) => void;
    moveTask: (taskId: string, newColumn: Column) => void;
    updateTask: (task: Task) => void;
    updateSettings: (partial: Partial<AppSettings>) => void;
    toggleSidebar: () => void;
    importTasks: (newTasks: Task[]) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
    kioskMode: false,
    lowBrightnessKiosk: true,
    weatherApiKey: undefined,
    weatherCity: 'Quimper',
    weatherCityId: undefined,
    theme: 'dark',
};

const syncIfNeeded = (updatedTasks: Task[]) => {
    invoke('sync_tasks_to_server', { tasks: updatedTasks }).catch(() => {});
};

export const useAppStore = create<AppStore>((set, get) => ({
    tasks: [],
    settings: DEFAULT_SETTINGS,
    sidebarOpen: true,

    fetchTasks: async () => {
        try {
            const tasks = await invoke<Task[]>('get_tasks');
            set({ tasks });
        } catch {
            set({ tasks: [] });
        }
    },

    addTask: (title, column = 'TODO', description = '', priority = 'medium') => {
        const newTask: Task = {
            id: uuidv4(),
                                                           title,
                                                           description: description || undefined,
                                                           column,
                                                           priority: priority as Priority,
                                                           tags: [],
                                                           hasApi: false,
                                                           attachments: [],
                                                           customActions: [],
                                                           createdAt: new Date().toISOString(),
                                                           updatedAt: new Date().toISOString(),
        };
        set((state) => {
            const newTasks = [...state.tasks, newTask];
            syncIfNeeded(newTasks);
            return { tasks: newTasks };
        });
        invoke('save_task', { task: newTask }).catch(console.error);
    },

    deleteTask: (id) => {
        set((state) => {
            const newTasks = state.tasks.filter((t) => t.id !== id);
            syncIfNeeded(newTasks);
            return { tasks: newTasks };
        });
        invoke('delete_task', { id }).catch(console.error);
    },

    moveTask: (taskId, newColumn) => {
        set((state) => {
            const newTasks = state.tasks.map((t) =>
            t.id === taskId
            ? { ...t, column: newColumn, updatedAt: new Date().toISOString() }
            : t
            );
            syncIfNeeded(newTasks);
            return { tasks: newTasks };
        });
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) invoke('save_task', { task: { ...task, column: newColumn } }).catch(console.error);
    },

    updateTask: (task) => {
        set((state) => {
            const newTasks = state.tasks.map((t) => (t.id === task.id ? task : t));
            syncIfNeeded(newTasks);
            return { tasks: newTasks };
        });
        invoke('save_task', { task }).catch(console.error);
    },

    updateSettings: (partial) => {
        set((state) => ({ settings: { ...state.settings, ...partial } }));
    },

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

                                                           importTasks: (newTasks) => {
                                                               const currentTasks = get().tasks;
                                                               const existingIds = new Set(currentTasks.map((t) => t.id));
                                                               const toAdd = newTasks.filter((t) => !existingIds.has(t.id));
                                                               const merged = currentTasks.map((existing) => {
                                                                   const incoming = newTasks.find((t) => t.id === existing.id);
                                                                   if (!incoming) return existing;
                                                                   return new Date(incoming.updatedAt) > new Date(existing.updatedAt)
                                                                   ? incoming
                                                                   : existing;
                                                               });
                                                               const finalTasks = [...merged, ...toAdd];
                                                               set({ tasks: finalTasks });
                                                               syncIfNeeded(finalTasks);
                                                               toAdd.forEach((task) => invoke('save_task', { task }).catch(console.error));
                                                           },
}));
