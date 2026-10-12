# 🕒 Chronomètre Sport

Site web pour gérer facilement les entraînements Tabata ou circuits chronométrés, avec une option spéciale : le **minuteur des 4 Fantastiques**.
Disponible sur : [ChronoSport](https://sport.hugo-lembrez.fr/)

---

## 🚀 Fonctionnalités principales

### 🎯 Minuteur "4 Fantastiques" (prioritaire)

Sur la page d'accueil (bouton **4 Fantastiques** ou touche **4**), une séquence automatique :

* 🔹 30 sec d’exo
* 🔹 10 sec de pause
* 🔹 1 min d’exo
* 🔹 10 sec de pause
* 🔹 1 min 30 d’exo
* 🔹 10 sec de pause
* 🔹 2 min d’exo

> La page dédiée `4fantastiques.html` suit le même minutage, découpé en blocs de 30 s (la partie N = N exos de 30 s), avec une grille d'avancement.

---

### 💪 Mode Tabata classique

* Par défaut : **20 s d’exercice / 10 s de repos × 8 tours**
* Personnalisable : durée d’exercice, pause, nombre de tours et précompte (**Lancer avec mes réglages**).

---

### ⚙️ Options

* 🔊 Bips de décompte (3, 2, 1) et de changement d'étape, activables.
* 🔁 **Relance automatique** de la séquence en boucle.
* 📥 Export et import de séquences personnalisées en **JSON**.
* 📵 Option **"Empêcher la mise en veille"** grâce à l’API Wake Lock (comme YouTube).
* ⌨️ Raccourci clavier : appuie sur **4** pour lancer directement le mode 4 Fantastiques.
* 🔄 **Résiste au rafraîchissement** : le minuteur est calé sur l'horloge réelle, il continue de tourner pendant le rechargement et reprend exactement où il en est (en pause comme en cours).
* 💾 Les réglages (Tabata, son, boucle, anti-veille) sont mémorisés.
* 📲 **Application installable (PWA)** : « Ajouter à l'écran d'accueil » sur mobile ou « Installer » sur ordinateur, et **fonctionne hors connexion**.

#### Format d'import JSON

```json
[
  { "label": "Exercice 1", "duration": 30, "type": "work" },
  { "label": "Pause", "duration": 10, "type": "rest" }
]
```

`duration` est un nombre entier de secondes (> 0). `type` est optionnel : `work`, `rest` ou `countin`.

---

## 🧩 Technologies utilisées

* **HTML5** : structure de la page
* **CSS3 + Bootstrap 5** : design sobre et responsive
* **JavaScript (vanilla)** : logique du chronomètre, gestion des séquences et des sons (Web Audio API)
* **API Wake Lock** : empêche l’écran de s’éteindre pendant les séances
* **LocalStorage** : sauvegarde et restauration de l’état du minuteur
* **PWA** (manifest + service worker) : installation et mode hors connexion
* **Aucune ressource tierce** : Bootstrap est hébergé dans le dépôt, CSP stricte

---

## 🖥️ Installation & utilisation

1. Aller sur le site internet 
2. Choisis ton mode :

   * **Preset Tabata (20/10)**
   * **4 Fantastiques**
   * **Lancer avec mes réglages**
3. Clique sur **Démarrer** et c’est parti !

---

## 🔐 Compatibilité

Fonctionne sur la plupart des navigateurs modernes.

> L’API Wake Lock (empêcher la mise en veille) peut ne pas être supportée sur certains appareils.
> Après un rafraîchissement en pleine séance, les navigateurs bloquent le son jusqu'au premier geste : un message invite alors à toucher l'écran pour réactiver les bips.

---

## 📁 Structure du projet

```
index.html            # Page principale : Tabata, 4 Fantastiques, réglages, import/export
4fantastiques.html    # Page dédiée au mode "4 Fantastiques" (grille d'avancement)
mentions-legales.html # Page de mentions légales
404.html              # Page d'erreur GitHub Pages
manifest.webmanifest  # Manifest PWA
sw.js                 # Service worker (cache hors connexion)
favicon.ico
assets/chrono.js      # Moteur du minuteur partagé (temps, persistance, sons, wake lock)
assets/index.js       # Logique de la page d'accueil
assets/4fantastiques.js # Logique de la page 4 Fantastiques
assets/pwa.js         # Enregistrement du service worker
assets/style.css      # Styles communs
assets/icons/         # Icônes (SVG source + PNG)
assets/vendor/        # Bootstrap 5.3.2 (CSS)
.well-known/security.txt # Contact pour signaler une faille
.nojekyll             # Désactive Jekyll (nécessaire pour publier .well-known)
README.md             # Documentation du projet
```

> 🔁 **Mise à jour du site** : le service worker sert d'abord la version en cache puis télécharge la nouvelle en arrière-plan ; elle s'affiche au lancement suivant.
> Si un fichier est ajouté, renommé ou supprimé, mettre à jour la liste `PRECACHE` et incrémenter `CACHE` dans `sw.js`.

---

## 📬 Contact

Pour toute demande : **contact@hugo-lembrez.fr**

---

## 🧠 Auteur

Projet créé par **Hugo** — pour un usage sportif simple et fonctionnel.

