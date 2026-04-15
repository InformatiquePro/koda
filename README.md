# ⚡ Koda (v0.4.0)

Koda est un logiciel moderne d’organisation personnelle et d’affichage intelligent, conçu pour évoluer constamment et s’adapter à différents usages.

> ⚠️ Version actuelle : **v0.3.1 (Linux et tout appareil qui a un navigateur web)**  
> 🚧 En développement actif — de nombreuses fonctionnalités arrivent bientôt. Des fonctionnalités peuvent ne pas être fonctionnelle ou en developpement.  
> Tu veux build toi même ? Regarde comment faire [ICI](https://github.com/InformatiquePro/koda?tab=readme-ov-file#%EF%B8%8F-build-linuxandroid)  
> Licence AGPL : Respecter-là !  

---

## Comment utiliser ?
>Aller voir la section release pour récupérer les builds.  
>Je ne publie pas tout le temps de build android car c'est long à faire, mais vous pouvez compiler le projet vous même.

## ✨ Fonctionnalités actuelles

### 🖥️ Gestion des tâches de manières efficace
Un systeme de glisser-déposer simple et intuitif.

- Simple et efficace pour la productivité
- Timer pour les tâches

---

### 🖥️ Mode Kiosk
Un mode plein écran conçu pour les bureaux ou affichages dédiés.

- Expérience immersive
- Idéal pour écrans fixes

---

### 🌤️ Mode Info (Météo + Heure)
Un affichage simple et élégant pour consulter rapidement les informations essentielles :

- Heure en temps réel
- Météo actuelle
- Design minimaliste et lisible

---

### 🎨 Interface moderne
Koda propose une interface :

- Fluide et esthétique
- Inspirée des designs modernes
- Pensée pour une utilisation intuitive
- Optimisée pour la clarté et la productivité

---

## 🚧 Roadmap

Le projet est en constante évolution.

### Prochaines plateformes :
- 🪟 Windows
- 🤖 Android : lance dans la V0.3.0 avec le web-serveur

### Prochaines fonctionnalités :

- Surprise !!

---
## Images
<img width="1920" height="979" alt="image" src="https://github.com/user-attachments/assets/ce4eaa08-9904-4a11-9379-626829a43b6e" />
<img width="462" height="400" alt="image" src="https://github.com/user-attachments/assets/6db3313d-2ded-4144-a0a6-d6fed48d9311" />
<img width="508" height="576" alt="image" src="https://github.com/user-attachments/assets/20939495-7fca-4725-a4fa-dff871518d7f" />
<img width="388" height="224" alt="image" src="https://github.com/user-attachments/assets/01fcf455-30b8-469d-94e2-618da6b6ff8f" />
<img width="461" height="450" alt="image" src="https://github.com/user-attachments/assets/e6913024-15d1-48ad-b93f-ca7831a81f83" />
<img width="269" height="311" alt="image" src="https://github.com/user-attachments/assets/17f655e7-c1b3-4f1f-a375-27a081a36e2e" />

## ⚙️ Build (Linux/Android)

> Vous voulez build le projet ?
> le build sera après dispo dans cette emplacement : /src-tauri/target/release/bundle/appimage_deb/data/usr/bin/
```bash
git clone https://github.com/InformatiquePro/koda && cd koda
npm install
npm run tauri build
```
*Au bout de plusieurs build, je vous recommandes de faire ```rm -rf src-tauri/target/release/build``` pour éviter les erreurs.*
>Version APK Android abandonné. Déplacement de cette version en un serveur web, il n'est pas garantie que ça marche encore pour ce build, à éviter d'utiliser.
Pour le build android, il faut avoir configurer et installé android studio, avec le sdk cible installe.
```bash
npm run tauri android init
npm run tauri android build
```
Noubliez pas de signer l'apk sinon votre appareil refusera de l'installer.  
Astuce : si vous êtes sur Linux, il est probable que les outils zipalign et apksigner nécéssaire pour signer l'apk ne sois pas disponnible alors que tout est bien installé.  
Pour corriger cela lancer ces commandes en adaptant à votre distribution linux/chemin d'accès aux SDK :
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/build-tools/$(ls $ANDROID_HOME/build-tools | tail -1)
```

