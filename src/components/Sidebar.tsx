import { Box, Flex, Text, IconButton, Separator } from '@radix-ui/themes';
import { useAppStore } from '../store/appStore';
import { useWebServer } from '../hooks/useWebServer';
import StatsPanel    from './sidebar/StatsPanel';
import SettingsPanel from './sidebar/SettingsPanel';
import WebServerPanel from './sidebar/WebServerPanel';
import DataPanel     from './sidebar/DataPanel';

export default function Sidebar() {
    const { sidebarOpen, toggleSidebar, settings, updateSettings, tasks, importTasks } = useAppStore();
    const { serverUrl, running, startServer, stopServer } = useWebServer();

    return (
        <Box
        className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}
        style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: sidebarOpen ? '16px' : '12px',
            overflowY: 'auto',
            overflowX: 'hidden',
        }}
        >
        {/* Toggle */}
        <Flex justify={sidebarOpen ? 'between' : 'center'} align="center" mb="4">
        {sidebarOpen && (
            <Text size="4" weight="bold" style={{ color: 'var(--accent-9)' }}>
            ⚡ Koda
            </Text>
        )}
        <IconButton variant="ghost" onClick={toggleSidebar} size="2">
        {sidebarOpen ? '◀' : '▶'}
        </IconButton>
        </Flex>

        {sidebarOpen && (
            <>
            <StatsPanel tasks={tasks} />

            <Separator size="4" mb="3" />

            <SettingsPanel settings={settings} updateSettings={updateSettings} />

            <Separator size="4" mb="3" />

            <WebServerPanel
            running={running}
            serverUrl={serverUrl}
            onStart={() => startServer(3131)}
            onStop={stopServer}
            />

            <Separator size="4" mb="3" />

            <DataPanel
            tasks={tasks}
            settings={settings}
            importTasks={importTasks}
            updateSettings={updateSettings}
            />
            </>
        )}
        </Box>
    );
}
