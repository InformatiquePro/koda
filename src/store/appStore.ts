// src/store/appStore.ts


import { create } from 'zustand';
import { Task, AppSettings, Column, Priority, CustomAction, SubTask } from '../types/koda';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';

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
    addTask: (title: string, column?: Column, description?: string, priority?: Priority, extras?: TaskExtras) => void;
    deleteTask: (id: string) => void;
    moveTask: (taskId: string, newColumn: Column) => void;
    triggerTimerIfNeeded: (taskId: string, newColumn: Column) => void;
    updateTask: (task: Task) => void;
    updateSettings: (partial: Partial<AppSettings>) => void;
    toggleSidebar: () => void;
    importTasks: (newTasks: Task[]) => void;
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

const syncIfNeeded = (updatedTasks: Task[]) => {
    invoke('sync_tasks_to_server', { tasks: updatedTasks }).catch(() => {});
};

export const useAppStore = create<AppStore>((set, get) => ({
    tasks: [],
    settings: DEFAULT_SETTINGS,
    sidebarOpen: true,
    pendingTimerTaskId: null,
    pendingBlockedTaskId: null,

    setPendingBlockedTaskId: (id) => set({ pendingBlockedTaskId: id }),

                                                           confirmBlocked: (taskId, reason) => {
                                                               set((state) => {
                                                                   const newTasks = state.tasks.map((t) =>
                                                                   t.id === taskId
                                                                   ? { ...t, blockedReason: reason || undefined, updatedAt: new Date().toISOString() }
                                                                   : t
                                                                   );
                                                                   syncIfNeeded(newTasks);
                                                                   return { tasks: newTasks, pendingBlockedTaskId: null };
                                                               });
                                                               const task = get().tasks.find((t) => t.id === taskId);
                                                               if (task) invoke('save_task', { task }).catch(console.error);
                                                           },

                                                           fetchTasks: async () => {
                                                               try {
                                                                   const tasks = await invoke<Task[]>('get_tasks');
                                                                   set({ tasks });
                                                               } catch {
                                                                   set({ tasks: [] });
                                                               }
                                                           },

                                                           // ← seule fonction modifiée
                                                           addTask: (title, column = 'TODO', description = '', priority = 'medium', extras = {}) => {
                                                               const newTask: Task = {
                                                                   id:            uuidv4(),
                                                           title,
                                                           description:   description || undefined,
                                                           column,
                                                           priority:      priority as Priority,
                                                           tags:          [],
                                                           hasApi:        extras.hasApi        ?? false,
                                                           apiUrl:        extras.apiUrl,
                                                           apiMethod:     extras.apiMethod,
                                                           customActions: extras.customActions ?? [],
                                                           subTasks:      extras.subTasks      ?? [],
                                                           attachments:   [],
                                                           createdAt:     new Date().toISOString(),
                                                           updatedAt:     new Date().toISOString(),
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
                                                                   ? {
                                                                       ...t,
                                                                       column: newColumn,
                                                                       updatedAt: new Date().toISOString(),
                                                                                                    blockedReason: newColumn !== 'BLOCKED' ? undefined : t.blockedReason,
                                                                   }
                                                                   : t
                                                                   );
                                                                   syncIfNeeded(newTasks);
                                                                   return { tasks: newTasks };
                                                               });

                                                               if (newColumn === 'BLOCKED' || newColumn === 'DONE') {
                                                                   set((state) => ({
                                                                       tasks: state.tasks.map((t) =>
                                                                       t.id === taskId
                                                                       ? { ...t, pomodoroDuration: undefined, pomodoroStartedAt: undefined }
                                                                       : t
                                                                       ),
                                                                   }));
                                                               }

                                                               const task = get().tasks.find((t) => t.id === taskId);
                                                               if (task) invoke('save_task', { task: { ...task, column: newColumn } }).catch(console.error);
                                                           },

                                                           triggerTimerIfNeeded: (taskId, newColumn) => {
                                                               if (newColumn === 'IN_PROGRESS') set({ pendingTimerTaskId: taskId });
                                                               if (newColumn === 'BLOCKED')     set({ pendingBlockedTaskId: taskId });
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

                                                           setPendingTimerTaskId: (id) => set({ pendingTimerTaskId: id }),

                                                           startTimer: (taskId, seconds) => {
                                                               set((state) => {
                                                                   const newTasks = state.tasks.map((t) =>
                                                                   t.id === taskId
                                                                   ? { ...t, pomodoroDuration: seconds, pomodoroStartedAt: new Date().toISOString() }
                                                                   : t
                                                                   );
                                                                   syncIfNeeded(newTasks);
                                                                   return { tasks: newTasks, pendingTimerTaskId: null };
                                                               });
                                                           },

                                                           stopTimer: (taskId) => {
                                                               set((state) => {
                                                                   const newTasks = state.tasks.map((t) =>
                                                                   t.id === taskId
                                                                   ? { ...t, pomodoroDuration: undefined, pomodoroStartedAt: undefined }
                                                                   : t
                                                                   );
                                                                   syncIfNeeded(newTasks);
                                                                   return { tasks: newTasks };
                                                               });
                                                           },

                                                           importTasks: (newTasks) => {
                                                               const currentTasks = get().tasks;
                                                               const existingIds  = new Set(currentTasks.map((t) => t.id));
                                                               const toAdd        = newTasks.filter((t) => !existingIds.has(t.id));
                                                               const merged       = currentTasks.map((existing) => {
                                                                   const incoming = newTasks.find((t) => t.id === existing.id);
                                                                   if (!incoming) return existing;
                                                                   return new Date(incoming.updatedAt) > new Date(existing.updatedAt) ? incoming : existing;
                                                               });
                                                               const finalTasks = [...merged, ...toAdd];
                                                               set({ tasks: finalTasks });
                                                               syncIfNeeded(finalTasks);
                                                               toAdd.forEach((task) => invoke('save_task', { task }).catch(console.error));
                                                           },
}));
