import { useEffect, useState } from 'react';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './index.css';
import { useAppStore } from './store/appStore';
import { Column, Priority, Task } from './types/koda';
import KanbanBoard from './components/KanbanBoard';
import KioskMode from './components/KioskMode';
import Sidebar from './components/Sidebar';
import TimerModal from './components/TimerModal';
import BlockedReasonModal from './components/BlockedReasonModal';
import DevBanner from './components/DevBanner';
import CommandPalette from './components/CommandPalette';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';


export default function App() {
  const {
    settings,
    tasks,
    pendingTimerTaskId,   setPendingTimerTaskId,   startTimer,
    pendingBlockedTaskId, setPendingBlockedTaskId, confirmBlocked,
  } = useAppStore();

  const [showCloseModal, setShowCloseModal] = useState(false);

  const pendingTimerTask   = tasks.find((t) => t.id === pendingTimerTaskId);
  const pendingBlockedTask = tasks.find((t) => t.id === pendingBlockedTaskId);

  // Listeners palette
  useEffect(() => {
    const unlisten: Array<() => void> = [];

    listen<{ title: string; column: Column; priority: Priority }>('palette-add-task', (e) => {
      useAppStore.getState().addTask(e.payload.title, e.payload.column, '', e.payload.priority);
    }).then(u => unlisten.push(u));

    listen<{ id: string; column: Column }>('palette-move-task', (e) => {
      useAppStore.getState().moveTask(e.payload.id, e.payload.column);
    }).then(u => unlisten.push(u));

    listen<{ id: string }>('palette-delete-task', (e) => {
      useAppStore.getState().deleteTask(e.payload.id);
    }).then(u => unlisten.push(u));

    listen<{ id: string; priority: Priority }>('palette-set-priority', (e) => {
      const task = useAppStore.getState().tasks.find((t: Task) => t.id === e.payload.id);
      if (task) useAppStore.getState().updateTask({ ...task, priority: e.payload.priority });
    }).then(u => unlisten.push(u));

    return () => unlisten.forEach(u => u());
  }, []);

  useEffect(() => {
    const unlisten_close = listen('ask-close-or-background', () => {
      // Toujours afficher la modale, peu importe le mode raccourci
      setShowCloseModal(true);
    });

    return () => { unlisten_close.then(u => u()); };
  }, []);

  // Listener fermeture fenêtre
  useEffect(() => {
    if (!settings.globalCommandShortcut) return;

    const unlisten_close = listen('ask-close-or-background', () => {
      setShowCloseModal(true);
    });

    return () => { unlisten_close.then(u => u()); };
  }, [settings.globalCommandShortcut]);

  async function handleBackground() {
    setShowCloseModal(false);
    await getCurrentWindow().hide();
  }

  async function handleQuit() {
    setShowCloseModal(false);

    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('force_quit');
  }

  if (settings.kioskMode) {
    return (
      <Theme appearance="dark" accentColor="violet" radius="large" scaling="110%">
      <DevBanner />
      <CommandPalette />
      <KioskMode />
      {showCloseModal && <CloseModal onBackground={handleBackground} onQuit={handleQuit} />}
      </Theme>
    );
  }

  return (
    <Theme appearance="dark" accentColor="violet" radius="large">
    <DevBanner />
    <CommandPalette />
    <div className="koda-layout">
    <Sidebar />
    <KanbanBoard />
    </div>

    {showCloseModal && <CloseModal onBackground={handleBackground} onQuit={handleQuit} />}

    {/* Modale fermeture */}
    {showCloseModal && <CloseModal onBackground={handleBackground} onQuit={handleQuit} />}



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

// Composant modale fermeture
function CloseModal({ onBackground, onQuit }: { onBackground: () => void; onQuit: () => void }) {
  return (
    <div className="close-modal-overlay">
    <div className="close-modal">
    <h3>🔔 Fermer Koda ?</h3>
    <p>Koda peut continuer à tourner en arrière-plan.</p>
    <div className="close-modal-actions">
    <button onClick={onBackground}>
    🔽 Réduire en arrière-plan
    </button>
    <button onClick={onQuit} className="btn-danger">
    ✕ Quitter complètement
    </button>
    </div>
    </div>
    </div>
  );
}
