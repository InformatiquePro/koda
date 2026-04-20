>Applicable à partir de la V0.7.0 qui n'est pas encore sortie
# ⌨️ Koda — Palette de Commandes (`Ctrl+K`)

La palette de commandes permet de créer des tâches, changer leur statut, modifier leur priorité ou les supprimer **sans jamais toucher la souris**. Elle est conçue pour une utilisation quotidienne en production.

***

## Ouvrir / Fermer

| Action | Raccourci |
|--------|-----------|
| Ouvrir ou fermer la palette | `Ctrl+K` (ou `⌘K` sur macOS) |
| Fermer | `Échap` |
| Retour à l'étape précédente | `⌫ Backspace` (sur un champ vide) |

***

## Créer une tâche rapidement

C'est l'action la plus rapide. Tape directement dans la palette sans sélectionner de commande, puis appuie sur `↵ Entrée`.

### Syntaxe

```
Titre de la tâche [!priorité] [>COLONNE]
```

| Modificateur | Valeurs | Description |
|---|---|---|
| `!priorité` | `!low` `!medium` `!high` `!urgent` | Définit la priorité (défaut : `medium`) |
| `>COLONNE` | `>TODO` `>IN_PROGRESS` `>BLOCKED` `>DONE` | Définit la colonne de destination (défaut : `TODO`) |

### Exemples

```
Config Stripe !urgent >IN_PROGRESS
```
→ Crée une tâche **urgente** directement dans la colonne **En cours**

```
Fix bug login !high
```
→ Crée une tâche **haute priorité** dans **À faire**

```
Réunion client
```
→ Crée une tâche avec priorité **moyenne** dans **À faire**

```
Déploiement prod !urgent >DONE
```
→ Crée une tâche urgente directement dans **Terminé**

> **Astuce** : Les modificateurs peuvent être placés n'importe où dans la phrase. L'ordre n'a pas d'importance.

***

## Commandes disponibles

Depuis l'écran d'accueil de la palette (`Ctrl+K`), les commandes suivantes sont accessibles via le clavier ou la souris :

### ➕ Nouvelle tâche

Ouvre le mode de création avec un aperçu en temps réel.  
Même syntaxe que la création rapide : `Titre !priorité >COLONNE`.

### ↔️ Déplacer une tâche

Déplace une tâche existante vers une autre colonne en deux étapes :

1. **Sélectionner la tâche** — recherche par nom
2. **Choisir la colonne de destination**

> **Raccourci** : depuis l'écran d'accueil, il est possible de cliquer directement sur une colonne cible (ex. : *Tâches → Terminé*) pour présélectionner la destination, puis choisir la tâche.

### 🎯 Changer la priorité

Modifie la priorité d'une tâche existante en deux étapes :

1. **Sélectionner la tâche**
2. **Choisir le niveau** : `🟢 Faible` / `🟡 Moyenne` / `🟠 Haute` / `🔴 Urgente`

### 🗑️ Supprimer une tâche

Supprime définitivement une tâche. **L'action est immédiate**, sans confirmation supplémentaire.

1. **Rechercher la tâche** par nom
2. `↵ Entrée` pour confirmer la suppression

***

## Navigation au clavier

| Touche | Action |
|--------|--------|
| `↑` / `↓` | Naviguer entre les options |
| `↵ Entrée` | Sélectionner / Confirmer |
| `⌫ Backspace` (champ vide) | Retour à l'étape précédente |
| `Échap` | Fermer la palette |
| `Ctrl+K` | Ouvrir / Fermer |

***

## Fil d'Ariane (Breadcrumb)

En haut de la palette, un fil d'Ariane indique l'étape en cours et permet de naviguer en arrière en cliquant dessus :

```
Commandes › Déplacer — choisir la tâche › Ma tâche › Choisir la colonne
```

***

## Référence des colonnes et priorités

### Colonnes

| Identifiant | Affichage | Emoji |
|---|---|---|
| `TODO` | À faire | 📋 |
| `IN_PROGRESS` | En cours | ⚡ |
| `BLOCKED` | Bloqué | 🔴 |
| `DONE` | Terminé | ✅ |

### Priorités

| Identifiant | Affichage | Emoji |
|---|---|---|
| `low` | Faible | 🟢 |
| `medium` | Moyenne | 🟡 |
| `high` | Haute | 🟠 |
| `urgent` | Urgente | 🔴 |

***

## Exemples de flux complets

### Créer et déplacer en 5 secondes

```
Ctrl+K → "Démo client !urgent >TODO" → ↵
Ctrl+K → Déplacer → "Démo client" → IN_PROGRESS → ↵
```

### Marquer une tâche comme urgente

```
Ctrl+K → Priorité → "Démo client" → 🔴 Urgente → ↵
```

### Supprimer une tâche obsolète

```
Ctrl+K → Supprimer → "Ancienne tâche" → ↵
```

***

## Notes

- Les modificateurs `!priorité` et `>COLONNE` sont **optionnels** et insensibles à la casse (`!URGENT` fonctionne comme `!urgent`).
- La palette est accessible depuis **n'importe quelle vue** de Koda.
- La palette ne se ferme pas automatiquement après une action pour permettre d'enchaîner plusieurs commandes rapidement. Utilise `Échap` ou `Ctrl+K` pour la fermer.
