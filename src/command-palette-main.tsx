// src/command-palette-main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './index.css';
import CommandPaletteStandalone from './components/CommandPaletteStandalone';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
    <Theme appearance="dark" accentColor="violet" radius="large">
    <CommandPaletteStandalone />
    </Theme>
    </React.StrictMode>
);
