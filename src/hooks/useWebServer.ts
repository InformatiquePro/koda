// src/hooks/useWebServer.ts

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import { Task } from '../types/koda';

export function useWebServer() {
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const { tasks } = useAppStore();
    const wsRef = useRef<WebSocket | null>(null);
    const portRef = useRef<number>(3131);
    const fromWebRef = useRef(false); // true quand la mise à jour vient du web

    // PC → Web : sync seulement si le changement vient du PC (pas du web)
    useEffect(() => {
        if (!running) return;
        if (fromWebRef.current) {
            fromWebRef.current = false; // reset le flag, ne pas renvoyer
            return;
        }
        invoke('sync_tasks_to_server', { tasks }).catch(() => {});
    }, [tasks, running]);

    function connectWs(port: number) {
        const ws = new WebSocket(`ws://localhost:${port}/ws`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            try {
                const incoming = JSON.parse(e.data) as Task[];
                // Marque que ce changement vient du web → évite la boucle
                fromWebRef.current = true;
                useAppStore.getState().importTasks(incoming);
            } catch {}
        };

        ws.onclose = () => {
            if (wsRef.current !== null) {
                setTimeout(() => connectWs(port), 2000);
            }
        };
    }

    async function startServer(port = 3131) {
        try {
            portRef.current = port;
            const url = await invoke<string>('start_web_server', { port });
            setServerUrl(url);
            setRunning(true);
            await invoke('sync_tasks_to_server', { tasks });
            setTimeout(() => connectWs(port), 500);
        } catch (e) {
            console.error('Erreur démarrage serveur :', e);
        }
    }

    async function stopServer() {
        try {
            await invoke('stop_web_server');
            wsRef.current?.close();
            wsRef.current = null;
            setRunning(false);
            setServerUrl(null);
        } catch (e) {
            console.error('Erreur arrêt serveur :', e);
        }
    }

    return { serverUrl, running, startServer, stopServer };
}
