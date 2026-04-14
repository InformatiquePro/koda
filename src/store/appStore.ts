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
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        invoke('save_task', { task: newTask }).catch(console.error);
    },

    deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
        invoke('delete_task', { id }).catch(console.error);
    },

    moveTask: (taskId, newColumn) => {
        set((state) => ({
            tasks: state.tasks.map((t) =>
            t.id === taskId
            ? { ...t, column: newColumn, updatedAt: new Date().toISOString() }
            : t
            ),
        }));
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) invoke('save_task', { task: { ...task, column: newColumn } }).catch(console.error);
    },

    updateTask: (task) => {
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
        }));
        invoke('save_task', { task }).catch(console.error);
    },

    updateSettings: (partial) => {
        set((state) => ({ settings: { ...state.settings, ...partial } }));
    },

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

                                                           importTasks: (newTasks) => {
                                                               const currentTasks = get().tasks;

                                                               // Fusion sans doublons : on garde les tâches existantes
                                                               // et on ajoute uniquement celles dont l'ID n'existe pas encore
                                                               const existingIds = new Set(currentTasks.map((t) => t.id));
                                                               const toAdd = newTasks.filter((t) => !existingIds.has(t.id));

                                                               // Pour les tâches qui existent déjà, on prend la version
                                                               // la plus récente selon updatedAt
                                                               const merged = currentTasks.map((existing) => {
                                                                   const incoming = newTasks.find((t) => t.id === existing.id);
                                                                   if (!incoming) return existing;
                                                                   return new Date(incoming.updatedAt) > new Date(existing.updatedAt)
                                                                   ? incoming
                                                                   : existing;
                                                               });

                                                               const finalTasks = [...merged, ...toAdd];
                                                               set({ tasks: finalTasks });

                                                               // Sauvegarde chaque tâche importée
                                                               toAdd.forEach((task) => invoke('save_task', { task }).catch(console.error));
                                                           },
}));
