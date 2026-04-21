// src/components/CommandPalette.tsx

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { isPermissionGranted, sendNotification } from '@tauri-apps/plugin-notification';
import { useAppStore } from '../store/appStore';
import { Column, Priority } from '../types/koda';
import './CommandPalette.css';
import { getCurrentWindow } from '@tauri-apps/api/window';


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
| 'root'
| 'new-task'
| 'move-task'
| 'move-task-col'
| 'delete-task'
| 'set-priority'
| 'set-priority-task'
| 'set-priority-level';

export default function CommandPalette() {
    const [open, setOpen]                             = useState(false);
    const [query, setQuery]                           = useState('');
    const [mode, setMode]                             = useState<Mode>('root');
    const [selectedTaskId, setSelectedTaskId]         = useState<string | null>(null);
    const [selectedColumn, setSelectedColumn]         = useState<Column | null>(null);   // ← était manquant

    const { tasks, addTask, moveTask, deleteTask, updateTask } = useAppStore();


    // ── Notification ────────────────────────────────────────────────
    async function notify(title: string, body: string) {
        try {
            const granted = await isPermissionGranted();
            if (granted) sendNotification({ title, body });
        } catch (_) {}
    }

    // ── Raccourci Ctrl+K local (dans Koda) ──────────────────────────
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((v) => !v);
            }
            if (e.key === 'Escape') reset();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ── Raccourci global Ctrl+Shift+Space (depuis n'importe quelle app) ──
    useEffect(() => {
        async function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                await getCurrentWindow().hide(); // hide plutôt que close pour réutiliser
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ── Helpers ─────────────────────────────────────────────────────
    function reset() {
        setOpen(false);
        setQuery('');
        setMode('root');
        setSelectedTaskId(null);
        setSelectedColumn(null);
    }

    function goTo(m: Mode) {
        setMode(m);
        setQuery('');
    }

    // ── Création rapide : "Titre !urgent >IN_PROGRESS" ───────────────
    function parseAndCreate(raw: string) {
        let title: string      = raw.trim();
        let priority: Priority = 'medium';
        let column: Column     = 'TODO';

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

        if (title) {
            addTask(title, column, '', priority);
            notify('✅ Tâche créée', `"${title}" ajoutée dans ${column} (${priority})`);
            reset();
        }
    }

    const activeTasks  = tasks.filter((t) => t.column !== 'DONE');
    const allTasks     = tasks;
    const selectedTask = allTasks.find((t) => t.id === selectedTaskId);

    return (
        <>
        {open && (
            <div className="cp-overlay" onClick={reset}>
            <div className="cp-wrapper" onClick={(e) => e.stopPropagation()}>
            <Command className="cp-root" shouldFilter={mode === 'root' || mode === 'new-task'}>

            {/* ── Breadcrumb ── */}
            <div className="cp-breadcrumb">
            {mode === 'root'               && <span>Commandes</span>}
            {mode === 'new-task'           && <><span className="cp-crumb" onClick={() => goTo('root')}>Commandes</span> › Nouvelle tâche</>}
            {mode === 'move-task'          && <><span className="cp-crumb" onClick={() => goTo('root')}>Commandes</span> › Déplacer — choisir la tâche</>}
            {mode === 'move-task-col'      && <><span className="cp-crumb" onClick={() => goTo('move-task')}>Déplacer</span> › {selectedTask?.title}</>}
            {mode === 'delete-task'        && <><span className="cp-crumb" onClick={() => goTo('root')}>Commandes</span> › Supprimer — choisir la tâche</>}
            {mode === 'set-priority'       && <><span className="cp-crumb" onClick={() => goTo('root')}>Commandes</span> › Priorité — choisir la tâche</>}
            {mode === 'set-priority-task'  && <><span className="cp-crumb" onClick={() => goTo('set-priority')}>Priorité</span> › {selectedTask?.title}</>}
            {mode === 'set-priority-level' && <><span className="cp-crumb" onClick={() => goTo('set-priority-task')}>Priorité</span> › Choisir le niveau</>}
            </div>

            {/* ── Input ── */}
            <div className="cp-input-wrap">
            <span className="cp-input-icon">⌘</span>
            <Command.Input
            className="cp-input"
            placeholder={
                mode === 'root'        ? 'Tape une commande ou "Mon titre !urgent >IN_PROGRESS" pour créer…' :
                mode === 'new-task'    ? 'Titre… (!low/medium/high/urgent) (>TODO/IN_PROGRESS/BLOCKED/DONE)' :
                mode === 'move-task'   ? 'Rechercher une tâche…' :
                mode === 'delete-task' ? 'Rechercher une tâche à supprimer…' :
                mode === 'set-priority'? 'Rechercher une tâche…' :
                'Chercher…'
            }
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && (mode === 'root' || mode === 'new-task') && query.trim()) {
                    parseAndCreate(query);
                }
                if (e.key === 'Backspace' && query === '' && mode !== 'root') {
                    e.preventDefault();
                    goTo('root');
                }
            }}
            autoFocus
            />
            {mode !== 'root' && (
                <button className="cp-back" onClick={() => goTo('root')}>↩ ESC</button>
            )}
            </div>

            <Command.List className="cp-list">

            {/* ══ ROOT ══ */}
            {mode === 'root' && (
                <>
                <Command.Group heading="TÂCHES">
                <Command.Item className="cp-item" onSelect={() => goTo('new-task')}>
                <span className="cp-item-icon">➕</span>
                <span className="cp-item-label">Nouvelle tâche</span>
                <span className="cp-item-hint">titre !priorité &gt;COLONNE</span>
                </Command.Item>
                <Command.Item className="cp-item" onSelect={() => goTo('move-task')}>
                <span className="cp-item-icon">↔️</span>
                <span className="cp-item-label">Déplacer une tâche</span>
                <span className="cp-item-hint">changer de colonne</span>
                </Command.Item>
                <Command.Item className="cp-item" onSelect={() => goTo('set-priority')}>
                <span className="cp-item-icon">🎯</span>
                <span className="cp-item-label">Changer la priorité</span>
                <span className="cp-item-hint">low / medium / high / urgent</span>
                </Command.Item>
                <Command.Item className="cp-item" onSelect={() => goTo('delete-task')}>
                <span className="cp-item-icon">🗑️</span>
                <span className="cp-item-label">Supprimer une tâche</span>
                <span className="cp-item-hint">suppression définitive</span>
                </Command.Item>
                </Command.Group>

                <Command.Group heading="RACCOURCIS COLONNES">
                {COLUMNS.map((col) => (
                    <Command.Item
                    key={col.value}
                    className="cp-item"
                    onSelect={() => { setSelectedColumn(col.value); goTo('move-task'); }}
                    >
                    <span className="cp-item-icon">{col.emoji}</span>
                    <span className="cp-item-label">Tâches → {col.label}</span>
                    <span className="cp-item-hint">déplacer vers {col.value}</span>
                    </Command.Item>
                ))}
                </Command.Group>

                <Command.Group heading="AIDE SYNTAXE">
                <div className="cp-syntax">
                <div className="cp-syntax-row">
                <code>Config Stripe !urgent &gt;IN_PROGRESS</code>
                <span>→ crée une tâche urgente en cours</span>
                </div>
                <div className="cp-syntax-row">
                <code>Fix bug !high</code>
                <span>→ crée une tâche haute priorité dans À faire</span>
                </div>
                <div className="cp-syntax-row">
                <code>↵ Entrée</code>
                <span>→ confirme / sélectionne</span>
                </div>
                <div className="cp-syntax-row">
                <code>⌫ Backspace</code>
                <span>→ retour à l'étape précédente</span>
                </div>
                </div>
                </Command.Group>
                </>
            )}

            {/* ══ NEW TASK ══ */}
            {mode === 'new-task' && (
                <Command.Group heading="APERÇU">
                {query.trim() ? (
                    <Command.Item className="cp-item cp-item--preview" onSelect={() => parseAndCreate(query)}>
                    <span className="cp-item-icon">➕</span>
                    <span className="cp-item-label">
                    Créer <strong>"{query.replace(/![a-z]+/i, '').replace(/>[A-Z_]+/i, '').trim()}"</strong>
                    {query.match(/!(low|medium|high|urgent)/i) && (
                        <span className="cp-tag">
                        {PRIORITIES.find((p) => p.value === query.match(/!(low|medium|high|urgent)/i)![1].toLowerCase())?.emoji}
                        {' '}{query.match(/!(low|medium|high|urgent)/i)![1]}
                        </span>
                    )}
                    {query.match(/>(TODO|IN_PROGRESS|BLOCKED|DONE)/i) && (
                        <span className="cp-tag">
                        {COLUMNS.find((c) => c.value === query.match(/>(TODO|IN_PROGRESS|BLOCKED|DONE)/i)![1].toUpperCase())?.emoji}
                        {' '}{query.match(/>(TODO|IN_PROGRESS|BLOCKED|DONE)/i)![1]}
                        </span>
                    )}
                    </span>
                    <span className="cp-item-hint">↵ Créer</span>
                    </Command.Item>
                ) : (
                    <div className="cp-empty">
                    Tape le titre… ajoute <code>!urgent</code> ou <code>&gt;IN_PROGRESS</code>
                    </div>
                )}
                </Command.Group>
            )}

            {/* ══ MOVE TASK — choisir la tâche ══ */}
            {mode === 'move-task' && (
                <Command.Group heading={`CHOISIR LA TÂCHE${selectedColumn ? ` → ${selectedColumn}` : ''}`}>
                {activeTasks.length === 0
                    ? <div className="cp-empty">Aucune tâche active</div>
                    : activeTasks.map((t) => (
                        <Command.Item
                        key={t.id}
                        className="cp-item"
                        value={t.title}
                        onSelect={() => {
                            setSelectedTaskId(t.id);
                            if (selectedColumn) {
                                moveTask(t.id, selectedColumn);
                                notify('↔️ Tâche déplacée', `"${t.title}" → ${COLUMNS.find(c => c.value === selectedColumn)?.label}`);
                                reset();
                            } else {
                                goTo('move-task-col');
                            }
                        }}
                        >
                        <span className="cp-item-icon">{COLUMNS.find((c) => c.value === t.column)?.emoji}</span>
                        <span className="cp-item-label">{t.title}</span>
                        <span className="cp-item-hint">{PRIORITIES.find((p) => p.value === t.priority)?.emoji} {t.priority}</span>
                        </Command.Item>
                    ))
                }
                </Command.Group>
            )}

            {/* ══ MOVE TASK — choisir la colonne ══ */}
            {mode === 'move-task-col' && (
                <Command.Group heading="DÉPLACER VERS">
                {COLUMNS.map((col) => (
                    <Command.Item
                    key={col.value}
                    className="cp-item"
                    onSelect={() => {
                        if (selectedTaskId) {
                            moveTask(selectedTaskId, col.value);
                            notify('↔️ Tâche déplacée', `"${selectedTask?.title}" → ${col.label}`);
                            reset();
                        }
                    }}
                    >
                    <span className="cp-item-icon">{col.emoji}</span>
                    <span className="cp-item-label">{col.label}</span>
                    <span className="cp-item-hint">{col.value}</span>
                    </Command.Item>
                ))}
                </Command.Group>
            )}

            {/* ══ DELETE ══ */}
            {mode === 'delete-task' && (
                <Command.Group heading="SUPPRIMER — choisir la tâche">
                {allTasks.length === 0
                    ? <div className="cp-empty">Aucune tâche</div>
                    : allTasks.map((t) => (
                        <Command.Item
                        key={t.id}
                        className="cp-item cp-item--danger"
                        value={t.title}
                        onSelect={() => {
                            deleteTask(t.id);
                            notify('🗑️ Tâche supprimée', `"${t.title}" a été supprimée`);
                            reset();
                        }}
                        >
                        <span className="cp-item-icon">{COLUMNS.find((c) => c.value === t.column)?.emoji}</span>
                        <span className="cp-item-label">{t.title}</span>
                        <span className="cp-item-hint" style={{ color: '#ef4444' }}>Supprimer ↵</span>
                        </Command.Item>
                    ))
                }
                </Command.Group>
            )}

            {/* ══ SET PRIORITY — choisir la tâche ══ */}
            {mode === 'set-priority' && (
                <Command.Group heading="CHOISIR LA TÂCHE">
                {allTasks.map((t) => (
                    <Command.Item
                    key={t.id}
                    className="cp-item"
                    value={t.title}
                    onSelect={() => { setSelectedTaskId(t.id); goTo('set-priority-level'); }}
                    >
                    <span className="cp-item-icon">{COLUMNS.find((c) => c.value === t.column)?.emoji}</span>
                    <span className="cp-item-label">{t.title}</span>
                    <span className="cp-item-hint">{PRIORITIES.find((p) => p.value === t.priority)?.emoji} {t.priority}</span>
                    </Command.Item>
                ))}
                </Command.Group>
            )}

            {/* ══ SET PRIORITY — choisir le niveau ══ */}
            {mode === 'set-priority-level' && (
                <Command.Group heading={`PRIORITÉ POUR "${selectedTask?.title}"`}>
                {PRIORITIES.map((p) => (
                    <Command.Item
                    key={p.value}
                    className="cp-item"
                    onSelect={() => {
                        if (selectedTask) {
                            updateTask({ ...selectedTask, priority: p.value });
                            notify('🎯 Priorité modifiée', `"${selectedTask.title}" → ${p.label}`);
                            reset();
                        }
                    }}
                    >
                    <span className="cp-item-icon">{p.emoji}</span>
                    <span className="cp-item-label">{p.label}</span>
                    <span className="cp-item-hint">{p.value}</span>
                    </Command.Item>
                ))}
                </Command.Group>
            )}

            </Command.List>

            {/* ── Footer ── */}
            <div className="cp-footer">
            <span><kbd>↑↓</kbd> naviguer</span>
            <span><kbd>↵</kbd> sélectionner</span>
            <span><kbd>⌫</kbd> retour</span>
            <span><kbd>Esc</kbd> fermer</span>
            <span style={{ marginLeft: 'auto', opacity: 0.4 }}>Ctrl+K</span>
            </div>

            </Command>
            </div>
            </div>
        )}
        </>
    );
}
