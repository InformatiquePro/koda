// src/utils/reportGenerator.ts

import { Task } from '../types/koda';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function line(char = '─', length = 60): string {
    return char.repeat(length);
}

export function generateReport(tasks: Task[]): string {
    const now   = new Date();
    const today = now.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const todo       = tasks.filter((t) => t.column === 'TODO');
    const inProgress = tasks.filter((t) => t.column === 'IN_PROGRESS');
    const blocked    = tasks.filter((t) => t.column === 'BLOCKED');
    const done       = tasks.filter((t) => t.column === 'DONE');

    const total       = tasks.length;
    const donePct     = total > 0 ? Math.round((done.length / total) * 100) : 0;
    const blockedPct  = total > 0 ? Math.round((blocked.length / total) * 100) : 0;
    const progressPct = total > 0 ? Math.round((inProgress.length / total) * 100) : 0;

    const barLength   = 40;
    const doneBar     = Math.round((donePct / 100) * barLength);
    const progressBar = Math.round((progressPct / 100) * barLength);
    const blockedBar  = Math.round((blockedPct / 100) * barLength);
    const todoBar     = barLength - doneBar - progressBar - blockedBar;
    const bar =
    '█'.repeat(Math.max(0, doneBar)) +
    '▓'.repeat(Math.max(0, progressBar)) +
    '░'.repeat(Math.max(0, blockedBar)) +
    '·'.repeat(Math.max(0, todoBar));

    function subTaskBlock(t: Task): string {
        if (!t.subTasks || t.subTasks.length === 0) return '';
        const subDone    = t.subTasks.filter((s) => s.status === 'done').length;
        const subBlocked = t.subTasks.filter((s) => s.status === 'blocked').length;
        const subTotal   = t.subTasks.length;
        const subPct     = Math.round((subDone / subTotal) * 100);

        const lines: string[] = [];
        lines.push(`     📋 Sous-tâches : ${subDone}/${subTotal} (${subPct}%)${subBlocked > 0 ? ` — ${subBlocked} bloquée(s)` : ''}`);

        t.subTasks.forEach((s) => {
            const icon   = s.status === 'done' ? '✓' : s.status === 'blocked' ? '🔴' : '○';
            const reason = s.status === 'blocked' && s.blockedReason ? ` → ${s.blockedReason}` : '';
            lines.push(`       ${icon} ${s.label}${reason}`);
        });

        return '\n' + lines.join('\n');
    }

    function taskBlock(t: Task): string {
        const priority = { low: '🟢', medium: '🟡', high: '🟠', urgent: '🔴' }[t.priority] ?? '⚪';
        const api      = t.hasApi ? ' [API]' : '';
        const timer    = t.pomodoroDuration
        ? ` [Timer: ${Math.round(t.pomodoroDuration / 60)}min]` : '';
        const desc     = t.description
        ? `\n     └─ ${t.description.slice(0, 120)}${t.description.length > 120 ? '…' : ''}` : '';
        const blocked  = t.blockedReason ? `\n     🔴 Raison : ${t.blockedReason}` : '';
        const subs     = subTaskBlock(t);
        return `  ${priority} ${t.title}${api}${timer}${desc}${blocked}${subs}`;
    }

    const lines: string[] = [];

    lines.push(line('═'));
    lines.push('  ⚡ KODA — RAPPORT JOURNALIER');
    lines.push(`  ${today}`);
    lines.push(`  Généré le ${formatDate(now.toISOString())}`);
    lines.push(line('═'));
    lines.push('');

    lines.push('  RÉSUMÉ GLOBAL');
    lines.push(line('─'));
    lines.push(`  Total des tâches   : ${total}`);
    lines.push(`  ✅ Terminées       : ${done.length} (${donePct}%)`);
    lines.push(`  ⚡ En cours        : ${inProgress.length} (${progressPct}%)`);
    lines.push(`  🔴 Bloquées        : ${blocked.length} (${blockedPct}%)`);
    lines.push(`  📋 À faire         : ${todo.length}`);
    lines.push('');
    lines.push(`  Progression : [${bar}] ${donePct}%`);
    lines.push('  █ Terminé   ▓ En cours   ░ Bloqué   · À faire');

    // Résumé des sous-tâches global
    const allSubTasks   = tasks.flatMap((t) => t.subTasks ?? []);
    if (allSubTasks.length > 0) {
        const subDoneTotal    = allSubTasks.filter((s) => s.status === 'done').length;
        const subBlockedTotal = allSubTasks.filter((s) => s.status === 'blocked').length;
        lines.push('');
        lines.push(`  Sous-tâches totales : ${allSubTasks.length}`);
        lines.push(`  ✓ Complétées : ${subDoneTotal}   🔴 Bloquées : ${subBlockedTotal}   ○ En attente : ${allSubTasks.length - subDoneTotal - subBlockedTotal}`);
    }
    lines.push('');

    // Sections par colonne
    const sections: [string, typeof done][] = [
        [`✅ TERMINÉES (${done.length})`, done],
        [`⚡ EN COURS (${inProgress.length})`, inProgress],
        [`🔴 BLOQUÉES (${blocked.length})`, blocked],
        [`📋 À FAIRE (${todo.length})`, todo],
    ];

    for (const [label, group] of sections) {
        lines.push(line('─'));
        lines.push(`  ${label}`);
        lines.push(line('─'));
        if (group.length === 0) {
            lines.push('  Aucune tâche.');
        } else {
            group.forEach((t) => lines.push(taskBlock(t)));
        }
        lines.push('');
    }

    // Urgentes non terminées
    const urgent = tasks.filter((t) => t.priority === 'urgent' && t.column !== 'DONE');
    if (urgent.length > 0) {
        lines.push(line('─'));
        lines.push(`  🚨 TÂCHES URGENTES NON TERMINÉES (${urgent.length})`);
        lines.push(line('─'));
        urgent.forEach((t) => lines.push(taskBlock(t)));
        lines.push('');
    }

    // Analyse
    lines.push(line('─'));
    lines.push('  ANALYSE');
    lines.push(line('─'));
    if (donePct >= 75)      lines.push('  🎉 Excellente journée ! Plus des 3/4 des tâches sont terminées.');
    else if (donePct >= 50) lines.push('  👍 Bonne progression, la moitié des tâches est accomplie.');
    else if (donePct >= 25) lines.push('  💪 Début de progression, continue sur ta lancée.');
    else                    lines.push('  📌 Beaucoup reste à faire, priorise les tâches urgentes.');
    if (blocked.length > 0) lines.push(`  ⚠️  ${blocked.length} tâche(s) bloquée(s) nécessitent ton attention.`);
    if (urgent.length > 0)  lines.push(`  🔥 ${urgent.length} tâche(s) urgente(s) sont encore en attente !`);
    if (inProgress.length > 3) lines.push(`  💡 ${inProgress.length} tâches en cours simultanément — pense à en terminer avant d'en commencer de nouvelles.`);

    // Sous-tâches bloquées en détail
    const blockedSubTasks = tasks.flatMap((t) =>
    (t.subTasks ?? [])
    .filter((s) => s.status === 'blocked')
    .map((s) => ({ taskTitle: t.title, sub: s }))
    );
    if (blockedSubTasks.length > 0) {
        lines.push('');
        lines.push(line('─'));
        lines.push(`  🔴 SOUS-TÂCHES BLOQUÉES (${blockedSubTasks.length})`);
        lines.push(line('─'));
        blockedSubTasks.forEach(({ taskTitle, sub }) => {
            lines.push(`  • [${taskTitle}] ${sub.label}`);
            if (sub.blockedReason) lines.push(`    └─ Raison : ${sub.blockedReason}`);
        });
        lines.push('');
    }

    lines.push('');
    lines.push(line('═'));
    lines.push('  Rapport généré par Koda');
    lines.push(line('═'));

    return lines.join('\n');
}
