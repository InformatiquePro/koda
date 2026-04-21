// src/components/CommandPaletteStandalone.tsx

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emitTo } from '@tauri-apps/api/event';
import { isPermissionGranted, sendNotification } from '@tauri-apps/plugin-notification';
import { useAppStore } from '../store/appStore';
import { Column, Priority } from '../types/koda';
import './CommandPalette.css';
import './CommandPaletteStandalone.css';

const COLUMNS: { value: Column; label: string; emoji: string }[] = [
    { value: 'TODO',        label: 'À faire',  emoji: '📋' },
{ value: 'IN_PROGRESS', label: 'En cours', emoji: '⚡' },
{ value: 'BLOCKED',     label: 'Bloqué',   emoji: '🔴' },
{ value: 'DONE',        label: 'Terminé',  emoji: '✅' },
];

const PRIORITIES: { value: Priority; label: string; emoji: string }[] = [
    { value: 'low',    label: 'Faible',  emoji: '🟢' },
{ value: 'medium', label: 'Moyenne', emoji: '🟡' },
{ value: 'high',   label: 'Haute',   emoji: '🟠' },
{ value: 'urgent', label: 'Urgente', emoji: '🔴' },
];

type Mode =
| 'root' | 'new-task' | 'move-task' | 'move-task-col'
| 'delete-task' | 'set-priority' | 'set-priority-level';

export default function CommandPaletteStandalone() {
    const [query, setQuery]                   = useState('');
    const [mode, setMode]                     = useState<Mode>('root');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);

    // Lecture seule du store pour afficher les tâches
    const tasks = useAppStore((s) => s.tasks);

    // Ferme/cache la fenêtre avec Échap
    useEffect(() => {
        async function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                await getCurrentWindow().hide();
            }
            if (e.key === 'Backspace' && query === '' && mode !== 'root') {
                e.preventDefault();
                goTo('root');
            }
        }
        // true = phase de capture, avant que cmdk reçoive l'événement
        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
    }, [query, mode]);

    async function closeWindow() {
        // Reset l'état avant de cacher
        setMode('root');
        setQuery('');
        setSelectedTaskId(null);
        setSelectedColumn(null);
        await getCurrentWindow().hide();
    }

    async function notify(title: string, body: string) {
        try {
            const granted = await isPermissionGranted();
            if (granted) sendNotification({ title, body });
        } catch (_) {}
    }

    function goTo(m: Mode) { setMode(m); setQuery(''); }

    async function reset() {
        await closeWindow();
    }

    async function parseAndCreate(raw: string) {
        let title: string      = raw.trim();
        let priority: Priority = 'medium';
        let column: Column     = 'TODO';

        console.log('[palette] parseAndCreate raw:', raw);

        const prioMatch = title.match(/!(low|medium|high|urgent)/i);
        if (prioMatch) {
            priority = prioMatch[1].toLowerCase() as Priority;
            title = title.replace(prioMatch[0], '').trim();
        }

        const colMatch = title.match(/>(TODO|IN_PROGRESS|BLOCKED|DONE)/i);
        if (colMatch) {
            column = colMatch[1].toUpperCase() as Column;
            title = title.replace(colMatch[0], '').trim();
        }

        console.log('[palette] titre final:', title, '| priorité:', priority, '| colonne:', column);

        if (title) {
            try {
                await emitTo('main', 'palette-add-task', { title, column, priority });
                console.log('[palette] emit OK');
                await notify('✅ Tâche créée', `"${title}" ajoutée dans ${column} (${priority})`);
            } catch (e) {
                console.error('[palette] emit ERREUR:', e);
            }
            await reset();
        } else {
            console.warn('[palette] titre vide après parsing, rien fait');
        }
    }

    const activeTasks  = tasks.filter((t) => t.column !== 'DONE');
    const allTasks     = tasks;
    const selectedTask = allTasks.find((t) => t.id === selectedTaskId);

    return (
        <div className="cps-root">
        <Command className="cp-root" shouldFilter={mode === 'root' || mode === 'new-task'}>

        {/* Breadcrumb */}
        <div className="cp-breadcrumb">
        {mode === 'root'               && <span>Commandes</span>}
        {mode === 'new-task'           && <><span className="cp-crumb" onClick={() => goTo('root')}>Commandes</span> › Nouvelle tâche</>}
        {mode === 'move-task'          && <><span className="cp-crumb" onClick={() => goTo('root')}>Commandes</span> › Déplacer</>}
        {mode === 'move-task-col'      && <><span className="cp-crumb" onClick={() => goTo('move-task')}>Déplacer</span> › {selectedTask?.title}</>}
        {mode === 'delete-task'        && <><span className="cp-crumb" onClick={() => goTo('root')}>Commandes</span> › Supprimer</>}
        {mode === 'set-priority'       && <><span className="cp-crumb" onClick={() => goTo('root')}>Commandes</span> › Priorité</>}
        {mode === 'set-priority-level' && <><span className="cp-crumb" onClick={() => goTo('set-priority')}>Priorité</span> › {selectedTask?.title}</>}
        </div>

        {/* Input */}
        <div className="cp-input-wrap">
        <span className="cp-input-icon">⌘</span>
        <Command.Input
        className="cp-input"
        placeholder={
            mode === 'root'        ? 'Commande ou "Titre !urgent >IN_PROGRESS"…' :
            mode === 'new-task'    ? 'Titre… (!low/medium/high/urgent) (>COLONNE)' :
            mode === 'move-task'   ? 'Rechercher une tâche…' :
            mode === 'delete-task' ? 'Rechercher une tâche à supprimer…' :
            'Chercher…'
        }
        value={query}
        onValueChange={setQuery}
        onKeyDown={(e) => {
            if (e.key === 'Enter' && (mode === 'root' || mode === 'new-task') && query.trim()) parseAndCreate(query);
            if (e.key === 'Backspace' && query === '' && mode !== 'root') { e.preventDefault(); goTo('root'); }
        }}
        autoFocus
        />
        <button className="cp-back cps-close" onClick={closeWindow}>✕</button>
        </div>

        <Command.List className="cp-list">

        {/* ROOT */}
        {mode === 'root' && (
            <>
            <Command.Group heading="TÂCHES">
            <Command.Item className="cp-item" onSelect={() => goTo('new-task')}>
            <span className="cp-item-icon">➕</span><span className="cp-item-label">Nouvelle tâche</span>
            <span className="cp-item-hint">titre !priorité &gt;COLONNE</span>
            </Command.Item>
            <Command.Item className="cp-item" onSelect={() => goTo('move-task')}>
            <span className="cp-item-icon">↔️</span><span className="cp-item-label">Déplacer une tâche</span>
            </Command.Item>
            <Command.Item className="cp-item" onSelect={() => goTo('set-priority')}>
            <span className="cp-item-icon">🎯</span><span className="cp-item-label">Changer la priorité</span>
            </Command.Item>
            <Command.Item className="cp-item" onSelect={() => goTo('delete-task')}>
            <span className="cp-item-icon">🗑️</span><span className="cp-item-label">Supprimer une tâche</span>
            </Command.Item>
            </Command.Group>
            <Command.Group heading="RACCOURCIS COLONNES">
            {COLUMNS.map((col) => (
                <Command.Item key={col.value} className="cp-item"
                onSelect={() => { setSelectedColumn(col.value); goTo('move-task'); }}>
                <span className="cp-item-icon">{col.emoji}</span>
                <span className="cp-item-label">Tâches → {col.label}</span>
                </Command.Item>
            ))}
            </Command.Group>
            </>
        )}

        {/* NEW TASK */}
        {mode === 'new-task' && (
            <Command.Group heading="APERÇU">
            {query.trim() ? (
                <Command.Item className="cp-item cp-item--preview" onSelect={() => parseAndCreate(query)}>
                <span className="cp-item-icon">➕</span>
                <span className="cp-item-label">
                Créer <strong>"{query.replace(/![a-z]+/i, '').replace(/>[A-Z_]+/i, '').trim()}"</strong>
                {query.match(/!(low|medium|high|urgent)/i) && (
                    <span className="cp-tag">{PRIORITIES.find(p => p.value === query.match(/!(low|medium|high|urgent)/i)![1].toLowerCase())?.emoji} {query.match(/!(low|medium|high|urgent)/i)![1]}</span>
                )}
                {query.match(/>(TODO|IN_PROGRESS|BLOCKED|DONE)/i) && (
                    <span className="cp-tag">{COLUMNS.find(c => c.value === query.match(/>(TODO|IN_PROGRESS|BLOCKED|DONE)/i)![1].toUpperCase())?.emoji} {query.match(/>(TODO|IN_PROGRESS|BLOCKED|DONE)/i)![1]}</span>
                )}
                </span>
                <span className="cp-item-hint">↵ Créer</span>
                </Command.Item>
            ) : (
                <div className="cp-empty">Tape le titre… <code>!urgent</code> ou <code>&gt;IN_PROGRESS</code></div>
            )}
            </Command.Group>
        )}

        {/* MOVE TASK */}
        {mode === 'move-task' && (
            <Command.Group heading={`CHOISIR LA TÂCHE${selectedColumn ? ` → ${selectedColumn}` : ''}`}>
            {activeTasks.length === 0
                ? <div className="cp-empty">Aucune tâche active</div>
                : activeTasks.map((t) => (
                    <Command.Item key={t.id} className="cp-item" value={t.title}
                    onSelect={async () => {
                        setSelectedTaskId(t.id);
                        if (selectedColumn) {
                            await emitTo('main', 'palette-move-task', { id: t.id, column: selectedColumn });
                            await notify('↔️ Tâche déplacée', `"${t.title}" → ${COLUMNS.find(c => c.value === selectedColumn)?.label}`);
                            await reset();
                        } else { goTo('move-task-col'); }
                    }}>
                    <span className="cp-item-icon">{COLUMNS.find(c => c.value === t.column)?.emoji}</span>
                    <span className="cp-item-label">{t.title}</span>
                    <span className="cp-item-hint">{PRIORITIES.find(p => p.value === t.priority)?.emoji} {t.priority}</span>
                    </Command.Item>
                ))
            }
            </Command.Group>
        )}

        {/* MOVE TASK COL */}
        {mode === 'move-task-col' && (
            <Command.Group heading="DÉPLACER VERS">
            {COLUMNS.map((col) => (
                <Command.Item key={col.value} className="cp-item"
                onSelect={async () => {
                    if (selectedTaskId) {
                        await emitTo('main', 'palette-move-task', { id: selectedTaskId, column: col.value });
                        await notify('↔️ Tâche déplacée', `"${selectedTask?.title}" → ${col.label}`);
                        await reset();
                    }
                }}>
                <span className="cp-item-icon">{col.emoji}</span>
                <span className="cp-item-label">{col.label}</span>
                </Command.Item>
            ))}
            </Command.Group>
        )}

        {/* DELETE */}
        {mode === 'delete-task' && (
            <Command.Group heading="SUPPRIMER">
            {allTasks.map((t) => (
                <Command.Item key={t.id} className="cp-item cp-item--danger" value={t.title}
                onSelect={async () => {
                    await emitTo('main', 'palette-delete-task', { id: t.id });
                    await notify('🗑️ Tâche supprimée', `"${t.title}" supprimée`);
                    await reset();
                }}>
                <span className="cp-item-icon">{COLUMNS.find(c => c.value === t.column)?.emoji}</span>
                <span className="cp-item-label">{t.title}</span>
                <span className="cp-item-hint" style={{ color: '#ef4444' }}>Supprimer ↵</span>
                </Command.Item>
            ))}
            </Command.Group>
        )}

        {/* SET PRIORITY */}
        {mode === 'set-priority' && (
            <Command.Group heading="CHOISIR LA TÂCHE">
            {allTasks.map((t) => (
                <Command.Item key={t.id} className="cp-item" value={t.title}
                onSelect={() => { setSelectedTaskId(t.id); goTo('set-priority-level'); }}>
                <span className="cp-item-icon">{COLUMNS.find(c => c.value === t.column)?.emoji}</span>
                <span className="cp-item-label">{t.title}</span>
                <span className="cp-item-hint">{PRIORITIES.find(p => p.value === t.priority)?.emoji} {t.priority}</span>
                </Command.Item>
            ))}
            </Command.Group>
        )}

        {/* SET PRIORITY LEVEL */}
        {mode === 'set-priority-level' && (
            <Command.Group heading={`PRIORITÉ — "${selectedTask?.title}"`}>
            {PRIORITIES.map((p) => (
                <Command.Item key={p.value} className="cp-item"
                onSelect={async () => {
                    if (selectedTask) {
                        await emitTo('main', 'palette-set-priority', { id: selectedTask.id, priority: p.value });
                        await notify('🎯 Priorité modifiée', `"${selectedTask.title}" → ${p.label}`);
                        await reset();
                    }
                }}>
                <span className="cp-item-icon">{p.emoji}</span>
                <span className="cp-item-label">{p.label}</span>
                </Command.Item>
            ))}
            </Command.Group>
        )}

        </Command.List>

        {/* Footer */}
        <div className="cp-footer">
        <span><kbd>↑↓</kbd> naviguer</span>
        <span><kbd>↵</kbd> sélectionner</span>
        <span><kbd>⌫</kbd> retour</span>
        <span><kbd>Esc</kbd> fermer</span>
        <span style={{ marginLeft: 'auto', opacity: 0.4 }}>Ctrl+Shift+Space</span>
        </div>

        </Command>
        </div>
    );
}
