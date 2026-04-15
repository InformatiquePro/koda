// src/App.tsx

import { useEffect } from 'react';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './index.css';
import {
  isPermissionGranted,
  requestPermission,
} from '@tauri-apps/plugin-notification';
import { useAppStore } from './store/appStore';
import KanbanBoard from './components/KanbanBoard';
import KioskMode from './components/KioskMode';
import Sidebar from './components/Sidebar';
import TimerModal from './components/TimerModal';

export default function App() {
  const { settings, pendingTimerTaskId, setPendingTimerTaskId, startTimer, tasks } = useAppStore();

  const pendingTask = tasks.find((t) => t.id === pendingTimerTaskId);

  // Demande la permission de notification au démarrage
  useEffect(() => {
    async function initNotifications() {
      try {
        const granted = await isPermissionGranted();
        if (!granted) {
          await requestPermission();
        }
      } catch (e) {
        console.error('Init notifications :', e);
      }
    }
    initNotifications();
  }, []);

  if (settings.kioskMode) {
    return (
      <Theme appearance="dark" accentColor="violet" radius="large" scaling="110%">
      <KioskMode />
      </Theme>
    );
  }

  return (
    <Theme appearance="dark" accentColor="violet" radius="large">
    <div className="koda-layout">
    <Sidebar />
    <KanbanBoard />
    </div>

    {/* Modale timer */}
    {pendingTask && (
      <TimerModal
      taskTitle={pendingTask.title}
      open={!!pendingTimerTaskId}
      onStart={(seconds) => startTimer(pendingTask.id, seconds)}
      onSkip={() => setPendingTimerTaskId(null)}
      />
    )}
    </Theme>
  );
}
