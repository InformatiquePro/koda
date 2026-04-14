import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './index.css';
import { useAppStore } from './store/appStore';
import KanbanBoard from './components/KanbanBoard';
import KioskMode from './components/KioskMode';
import Sidebar from './components/Sidebar';

export default function App() {
  const { settings } = useAppStore();

  // Mode Kiosk activé = affichage Station (tablette / PC plein écran)
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
    </Theme>
  );
}
