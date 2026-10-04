# Changelog

Toutes les modifications importantes apportées à Koda sont documentées dans ce fichier.

Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [0.8] - 2026-09-27

Version technique : `0.8.0`.

### Ajouté

- Mode Agenda activable depuis les paramètres.
- Synchronisation en lecture seule avec une collection CalDAV protégée par identifiant et mot de passe d’application.
- Import des flux iCalendar publics accessibles par URL.
- Import direct d’un fichier `.ics` présent sur l’ordinateur via le sélecteur de fichiers.
- Requête CalDAV limitée à une plage pertinente et demande d’expansion des événements récurrents.
- Import du titre, de la description, du lieu, du début, de la fin et du statut « journée entière » des événements.
- Synchronisation automatique au démarrage lorsque le mode Agenda est configuré, ainsi qu’un bouton de synchronisation manuelle.
- Navigation « Jour précédent », « Aujourd’hui » et « Jour suivant » au-dessus du tableau.
- Affichage explicite du jour sélectionné dans les colonnes « À faire » et « Fini ».
- Badges Agenda, date, horaire et lieu sur les cartes issues d’un calendrier.
- Date de réalisation sur les cartes terminées.
- Filtrage journalier de la colonne « Fini » afin de consulter l’avancement jour par jour.
- Tests du parseur iCalendar pour les rendez-vous horaires, les journées entières, les données CalDAV XML et les lignes repliées.
- Confirmation avant l’import des événements Agenda antérieurs à aujourd’hui.
- Accès aux tâches Agenda non terminées des jours précédents depuis la colonne « À faire ».
- Consultation des tâches terminées pour une date choisie depuis la colonne « Fini ».
- Rapports ciblés : aujourd’hui, date choisie, ou tâches hors Agenda.

### Modifié

- Les événements Agenda sont des tâches Koda ordinaires : ils peuvent être déplacés, modifiés, bloqués, chronométrés ou terminés.
- Une nouvelle synchronisation met à jour un événement existant grâce à son UID sans réinitialiser sa colonne ni son avancement.
- Une nouvelle importation du même fichier `.ics` met à jour ses événements sans créer de doublons.
- Les tâches prévues sont triées par horaire dans « À faire ».
- Les tâches finies sont triées par heure de réalisation pour le jour sélectionné.
- Le chargement initial des tâches et des paramètres est maintenant séquentiel afin d’éviter une course avec la synchronisation automatique.
- Format de sauvegarde JSON porté en version 3, avec métadonnées Agenda explicites et restauration des tâches Agenda.
- Version globale portée à `0.8.0` et menu « À propos » mis à jour avec `v0.8_charles-elie_27-09-26`.

### Corrigé

- L’export ne fonctionnait pas lorsqu’aucune tâche n’existait.
- La restauration fusionnait les données avec les tâches actuelles au lieu de restaurer réellement la sauvegarde.
- Une sauvegarde ancienne pouvait être ignorée à cause des dates de modification plus récentes présentes localement.
- La restauration pouvait laisser sur le disque des tâches absentes de la sauvegarde.
- Les tâches restaurées en double pouvaient conserver un identifiant identique.
- Les fichiers d’import invalides ou provenant d’une version inconnue n’étaient pas suffisamment contrôlés.
- Les réglages importés n’étaient pas validés selon leur type.
- Un événement déplacé dans le calendrier distant pouvait être recréé en double au lieu d’être mis à jour.

### Sécurité

- Les mots de passe CalDAV et les clés météo restent exclus des sauvegardes JSON.
- Les URL de calendrier sont limitées aux protocoles HTTP et HTTPS.
- Les réponses d’erreur distantes sont limitées en taille avant affichage.

### Compatibilité

- Lecture des sauvegardes historiques sous forme de tableau et du format Koda V1 maintenue.
- Prise en charge des événements iCalendar conformes aux champs principaux de la RFC 5545 et des requêtes `calendar-query` CalDAV de la RFC 4791.

## [0.7.0.1] - 2026-09-27

Version interne compatible SemVer : `0.7.0+1`.

### Ajouté

- Persistance locale des tâches dans le dossier de données de l'application.
- Persistance des paramètres utilisateur entre deux lancements.
- Normalisation des tâches chargées ou importées afin de réparer les champs absents ou invalides.
- Bouton fonctionnel d'appel API directement sur les cartes configurées.
- Prise en charge des méthodes HTTP `GET`, `POST`, `PUT`, `PATCH` et `DELETE`.
- Route locale `/api/webhook` permettant à l'interface web d'exécuter les API et webhooks sans blocage CORS du navigateur.
- Validation des URL HTTP/HTTPS dans les fenêtres de création et de modification d'une tâche.
- Validation des URL des actions contextuelles de type webhook.
- Demande explicite de permission avant l'envoi d'une notification système.
- Tests automatiques vérifiant le rejet des protocoles et méthodes HTTP non autorisés.
- Outil local `scripts/appimage-tools/pkgconf` pour rendre la génération AppImage fiable sur Arch Linux.

### Modifié

- Centralisation de l'enregistrement du raccourci global de la palette de commandes.
- Chargement des tâches et des paramètres au démarrage de l'application.
- Harmonisation des déplacements de tâches entre les colonnes, quelle que soit l'origine du déplacement.
- Déclenchement cohérent du choix de minuteur lors du passage dans « En cours ».
- Déclenchement cohérent de la demande de motif lors du passage dans « Bloqué ».
- Arrêt automatique du minuteur lorsqu'une tâche passe dans « Bloqué » ou « Terminé ».
- Filtrage des actions contextuelles selon la colonne dans laquelle elles doivent apparaître.
- Rafraîchissement des tâches dans la palette de commandes indépendante.
- Comportement de la touche Échap corrigé pour ne plus masquer la fenêtre principale depuis la palette intégrée.
- Synchronisation PC ↔ interface web revue afin d'éviter les boucles de mises à jour.
- Importation des tâches renforcée avec normalisation et résolution des mises à jour selon leur date.
- Transformation des webhooks Discord avec de véritables retours à la ligne.
- Messages d'erreur API limités à 500 caractères pour préserver l'interface.
- Délai maximal de 30 secondes appliqué aux appels API et webhooks.
- Version du projet mise à jour dans npm, Cargo, Tauri et Android.
- Menu « À propos » mis à jour avec `v0.7.0.1_charles-elie_27-09-26`.
- Configuration Tauri limitée à la production d'un paquet AppImage sous Linux.
- Commande `npm run tauri build` adaptée à la création d'une AppImage sur Arch Linux.

### Corrigé

- Les tâches créées, modifiées, déplacées ou supprimées n'étaient pas toujours conservées après redémarrage.
- Le bouton API affiché sur les tâches ne lançait auparavant aucune requête.
- Les appels API depuis l'interface web pouvaient échouer à cause des règles CORS du navigateur.
- Les erreurs réseau de l'interface web n'étaient pas présentées clairement à l'utilisateur.
- Les méthodes HTTP configurées sur une tâche n'étaient pas toujours respectées.
- Les URL non valides pouvaient être enregistrées sans avertissement.
- Les appels webhook pouvaient rester bloqués sans limite de temps.
- Une tâche supprimée depuis l'interface web pouvait réapparaître lors de la synchronisation suivante.
- Les suppressions reçues par WebSocket n'étaient pas répercutées dans le stockage local.
- Les mises à jour WebSocket pouvaient provoquer une boucle de resynchronisation.
- Le glisser-déposer pouvait déclencher des transitions incohérentes ou conserver une action annulée.
- Plusieurs chemins de déplacement ne déclenchaient pas les mêmes fenêtres de confirmation.
- La date de démarrage du minuteur était mal sérialisée côté Rust.
- La réinitialisation ou l'arrêt du minuteur n'était pas toujours persisté.
- Des actions contextuelles pouvaient apparaître dans la mauvaise colonne.
- L'action d'archivage pouvait supprimer une tâche sans confirmation.
- Les erreurs d'ouverture du port du serveur web local n'étaient pas correctement remontées.
- La fermeture de l'application pouvait enregistrer plusieurs écouteurs concurrents.
- L'interface web était vulnérable à l'injection de HTML ou de JavaScript via les données d'une tâche.
- La construction AppImage échouait sur Arch Linux à cause de `linuxdeploy`, du format RELR et de bibliothèques VMware détectées par erreur.

### Sécurité

- Rejet des URL API utilisant un protocole autre que HTTP ou HTTPS.
- Rejet des méthodes HTTP non prises en charge avant l'envoi d'une requête.
- Échappement des titres, descriptions, libellés et paramètres injectés dans l'interface web.
- Durcissement du `.gitignore` pour exclure les clés de signature, fichiers d'environnement, données locales et paquets compilés.

### Distribution et validation

- Compilation TypeScript/Vite validée avec `npm run build`.
- Compilation de l'ensemble des cibles Rust validée avec `cargo check`.
- Tests Rust des protections API validés : 2 tests réussis sur 2.
- AppImage x86-64 générée avec succès via `npm run tauri build`.
- Anciennes sorties DEB et RPM supprimées du dossier de distribution.
