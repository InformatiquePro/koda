export type Column = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ActionType = 'webhook' | 'export_pdf' | 'notify' | 'archive' | 'pomodoro';

export interface CustomAction {
    id: string;
    label: string;
    triggerColumn: Column;
    actionType: ActionType;
    payload?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    column: Column;
    priority: Priority;
    tags: string[];
    hasApi: boolean;
    apiUrl?: string;        // pour l'api
    apiMethod?: string;     // pour l'api
    attachments: string[];
    customActions: CustomAction[];
    pomodoroDuration?: number;
    createdAt: string;
    updatedAt: string;
}

export interface AppSettings {
    kioskMode: boolean;
    lowBrightnessKiosk: boolean;
    weatherApiKey?: string;
    weatherCity?: string;
    weatherCityId?: string;   // id ville
    theme: 'dark' | 'light';
}

export interface Trigger {
    id: string;
    taskId?: string;
    triggerType: 'time_in_column' | 'move_to_column';
    conditionValue: string;
    actionType: ActionType;
    actionPayload?: string;
    isActive: boolean;
}

