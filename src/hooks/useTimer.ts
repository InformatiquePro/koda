// src/hooks/useTimer.ts

import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from '@tauri-apps/plugin-notification';
import { useState, useEffect, useRef } from 'react';

interface UseTimerResult {
    remaining: number | null;  // secondes restantes
    isExpired: boolean;
    formatted: string;
}

export function useTimer(
    startedAt?: string,
    durationSeconds?: number
): UseTimerResult {
    const [remaining, setRemaining] = useState<number | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const notifiedRef = useRef(false);

    useEffect(() => {
        if (!startedAt || !durationSeconds) {
            setRemaining(null);
            setIsExpired(false);
            notifiedRef.current = false;
            return;
        }

        function compute() {
            const elapsed = (Date.now() - new Date(startedAt!).getTime()) / 1000;
            const left = Math.max(0, durationSeconds! - elapsed);
            setRemaining(Math.floor(left));

            if (left <= 0 && !notifiedRef.current) {
                notifiedRef.current = true;
                setIsExpired(true);
                sendTimerNotification();
            }
        }

        compute();
        const interval = setInterval(compute, 1000);
        return () => clearInterval(interval);
    }, [startedAt, durationSeconds]);

    function formatted(): string {
        if (remaining === null) return '';
        const d = Math.floor(remaining / 86400);
        const h = Math.floor((remaining % 86400) / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        if (d > 0) return `${d}j ${h}h ${m}m`;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    }

    return { remaining, isExpired, formatted: formatted() };
}

async function sendTimerNotification() {
    try {
        let granted = await isPermissionGranted();

        if (!granted) {
            const permission = await requestPermission();
            granted = permission === 'granted';
        }

        if (granted) {
            await sendNotification({
                title: '⏰ Koda — Temps écoulé !',
                body: 'Le timer de ta tâche est terminé.',
                sound: 'default',
            });
        } else {
            console.warn('Permission notification refusée');
        }
    } catch (e) {
        console.error('Notification échouée :', e);
    }
}
