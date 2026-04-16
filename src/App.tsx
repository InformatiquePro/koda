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
import BlockedReasonModal from './components/BlockedReasonModal';

export default function App() {
  const {
    settings,
    tasks,
    pendingTimerTaskId,   setPendingTimerTaskId,   startTimer,
    pendingBlockedTaskId, setPendingBlockedTaskId, confirmBlocked,
  } = useAppStore();

  const pendingTimerTask   = tasks.find((t) => t.id === pendingTimerTaskId);
  const pendingBlockedTask = tasks.find((t) => t.id === pendingBlockedTaskId);

  useEffect(() => {
    async function initNotifications() {
      try {
        const granted = await isPermissionGranted();
        if (!granted) await requestPermission();
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
    {pendingTimerTask && (
      <TimerModal
      taskTitle={pendingTimerTask.title}
      open={!!pendingTimerTaskId}
      onStart={(seconds) => startTimer(pendingTimerTask.id, seconds)}
      onSkip={() => setPendingTimerTaskId(null)}
      />
    )}

    {/* Modale blocage */}
    {pendingBlockedTask && (
      <BlockedReasonModal
      taskTitle={pendingBlockedTask.title}
      open={!!pendingBlockedTaskId}
      onConfirm={(reason) => confirmBlocked(pendingBlockedTask.id, reason)}
      onSkip={() => setPendingBlockedTaskId(null)}
      />
    )}
    </Theme>
  );
}
