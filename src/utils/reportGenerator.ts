// src/utils/reportGenerator.ts

import { Task } from '../types/koda';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function pad(str: string, length: number): string {
    return str.padEnd(length, ' ');
}

function line(char = '─', length = 60): string {
    return char.repeat(length);
}

export function generateReport(tasks: Task[]): string {
    const now = new Date();
    const today = now.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const todo       = tasks.filter((t) => t.column === 'TODO');
    const inProgress = tasks.filter((t) => t.column === 'IN_PROGRESS');
    const blocked    = tasks.filter((t) => t.column === 'BLOCKED');
    const done       = tasks.filter((t) => t.column === 'DONE');

    const total      = tasks.length;
    const donePct    = total > 0 ? Math.round((done.length / total) * 100) : 0;
    const blockedPct = total > 0 ? Math.round((blocked.length / total) * 100) : 0;
    const progressPct = total > 0 ? Math.round((inProgress.length / total) * 100) : 0;

    // Barre de progression visuelle
    const barLength = 40;
    const doneBar     = Math.round((donePct / 100) * barLength);
    const progressBar = Math.round((progressPct / 100) * barLength);
    const blockedBar  = Math.round((blockedPct / 100) * barLength);
    const todoBar     = barLength - doneBar - progressBar - blockedBar;
    const bar =
    '█'.repeat(Math.max(0, doneBar)) +
    '▓'.repeat(Math.max(0, progressBar)) +
    '░'.repeat(Math.max(0, blockedBar)) +
    '·'.repeat(Math.max(0, todoBar));

    function taskBlock(t: Task): string {
        const priority = { low: '🟢', medium: '🟡', high: '🟠', urgent: '🔴' }[t.priority] ?? '⚪';
        const api      = t.hasApi ? ' [API]' : '';
        const timer    = t.pomodoroDuration
        ? ` [Timer: ${Math.round(t.pomodoroDuration / 60)}min]`
        : '';
        const desc     = t.description
        ? `\n     └─ ${t.description.slice(0, 120)}${t.description.length > 120 ? '…' : ''}`
        : '';
        const blocked  = t.blockedReason          // ← ajouter
        ? `\n     🔴 Raison : ${t.blockedReason}`
        : '';
        return `  ${priority} ${t.title}${api}${timer}${desc}${blocked}`;
    }

    const lines: string[] = [];

    // En-tête
    lines.push(line('═'));
    lines.push('  ⚡ KODA — RAPPORT JOURNALIER');
    lines.push(`  ${today}`);
    lines.push(`  Généré le ${formatDate(now.toISOString())}`);
    lines.push(line('═'));
    lines.push('');

    // Résumé global
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
    lines.push('');

    // Tâches terminées
    lines.push(line('─'));
    lines.push(`  ✅ TERMINÉES (${done.length})`);
    lines.push(line('─'));
    if (done.length === 0) {
        lines.push('  Aucune tâche terminée.');
    } else {
        done.forEach((t) => lines.push(taskBlock(t)));
    }
    lines.push('');

    // Tâches en cours
    lines.push(line('─'));
    lines.push(`  ⚡ EN COURS (${inProgress.length})`);
    lines.push(line('─'));
    if (inProgress.length === 0) {
        lines.push('  Aucune tâche en cours.');
    } else {
        inProgress.forEach((t) => lines.push(taskBlock(t)));
    }
    lines.push('');

    // Tâches bloquées
    lines.push(line('─'));
    lines.push(`  🔴 BLOQUÉES (${blocked.length})`);
    lines.push(line('─'));
    if (blocked.length === 0) {
        lines.push('  Aucune tâche bloquée.');
    } else {
        blocked.forEach((t) => lines.push(taskBlock(t)));
    }
    lines.push('');

    // Tâches à faire
    lines.push(line('─'));
    lines.push(`  📋 À FAIRE (${todo.length})`);
    lines.push(line('─'));
    if (todo.length === 0) {
        lines.push('  Aucune tâche en attente.');
    } else {
        todo.forEach((t) => lines.push(taskBlock(t)));
    }
    lines.push('');

    // Priorités urgentes
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

    if (donePct >= 75) {
        lines.push('  🎉 Excellente journée ! Plus des 3/4 des tâches sont terminées.');
    } else if (donePct >= 50) {
        lines.push('  👍 Bonne progression, la moitié des tâches est accomplie.');
    } else if (donePct >= 25) {
        lines.push('  💪 Début de progression, continue sur ta lancée.');
    } else {
        lines.push('  📌 Beaucoup reste à faire, priorise les tâches urgentes.');
    }

    if (blocked.length > 0) {
        lines.push(`  ⚠️  ${blocked.length} tâche(s) bloquée(s) nécessitent ton attention.`);
    }
    if (urgent.length > 0) {
        lines.push(`  🔥 ${urgent.length} tâche(s) urgente(s) sont encore en attente !`);
    }
    if (inProgress.length > 3) {
        lines.push(`  💡 ${inProgress.length} tâches en cours simultanément — pense à en terminer avant d'en commencer de nouvelles.`);
    }

    lines.push('');
    lines.push(line('═'));
    lines.push('  Rapport généré par Koda — https://github.com/InformatiquePro/koda');
    lines.push(line('═'));

    // Supprime l'avertissement TypeScript sur pad inutilisé
    void pad;

    return lines.join('\n');
}
