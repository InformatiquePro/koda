# ⚡ Koda (v0.1.0)

Koda est un logiciel moderne d’organisation personnelle et d’affichage intelligent, conçu pour évoluer constamment et s’adapter à différents usages.

> ⚠️ Version actuelle : **v0.1.0 (Linux et android 15 et + uniquement)**  
> 🚧 En développement actif — de nombreuses fonctionnalités arrivent bientôt. Des fonctionnalités peuvent ne pas être fonctionnelle ou en developpement.  
> Tu veux build toi même ? Regarde comment faire [ICI](https://github.com/InformatiquePro/koda?tab=readme-ov-file#%EF%B8%8F-build-linuxandroid)  
> Licence AGPL : Respecter-là !  

---

## ✨ Fonctionnalités actuelles

### 🖥️ Mode Kiosk
Un mode plein écran conçu pour les espaces publics, bureaux ou affichages dédiés.

- Expérience immersive
- Idéal pour bornes ou écrans fixes

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
- 🤖 Android  ( andoid 6 et +) ANDROID 15 ET + DEJA DISPO DANS RELEASE V0.1.0

### Prochaines fonctionnalités :

- Thèmes dynamiques
- Améliorations du mode kiosk
- connexion à des services extrernes 

---
## Images
<img width="1920" height="979" alt="image" src="https://github.com/user-attachments/assets/ce4eaa08-9904-4a11-9379-626829a43b6e" />
<img width="462" height="400" alt="image" src="https://github.com/user-attachments/assets/6db3313d-2ded-4144-a0a6-d6fed48d9311" />
<img width="462" height="453" alt="image" src="https://github.com/user-attachments/assets/ac19ff7c-f83e-4623-86a1-22b5abc12448" />
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

