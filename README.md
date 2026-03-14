# 🕒 Chronomètre Sport

Site web pour gérer facilement les entraînements Tabata ou circuits chronométrés, avec une option spéciale : le **minuteur des 4 Fantastiques**.
Disponible sur : [ChronoSport](https://sport.hugo-lembrez.fr/)

---

## 🚀 Fonctionnalités principales

### 🎯 Minuteur "4 Fantastiques" (prioritaire)

Une séquence automatique d'entraînement :

* 🔹 30 sec d’exo
* 🔹 10 sec de pause
* 🔹 1 min d’exo
* 🔹 10 sec de pause
* 🔹 1 min 30 d’exo
* 🔹 10 sec de pause
* 🔹 2 min d’exo

> Possibilité d’activer la **relance automatique** du cycle.

---

### 💪 Mode Tabata classique

* Par défaut : **20 s d’exercice / 10 s de repos × 8 tours**
* Personnalisable : durée d’exercice, pause, nombre de tours et précompte.

---

### ⚙️ Options

* 🔊 Sons et bips de transitions activables.
* 🔁 Export et import de séquences personnalisées en **JSON**.
* 📵 Option **"Empêcher la mise en veille"** grâce à l’API Wake Lock (comme YouTube).
* 🎚️ Réglage du volume.
* ⌨️ Raccourci clavier : appuie sur **4** pour lancer directement le mode 4 Fantastiques.
* 🔄 **Persistance de l’état** : le minuteur reprend là où il s’est arrêté après une actualisation.

---

## 🧩 Technologies utilisées

* **HTML5** : structure de la page
* **CSS3 + Bootstrap 5** : design sobre et responsive
* **JavaScript (vanilla)** : logique du chronomètre, gestion des séquences et des sons
* **API Wake Lock** : empêche l’écran de s’éteindre pendant les séances
* **LocalStorage** : sauvegarde et restauration de l’état du minuteur

---

## 🖥️ Installation & utilisation

1. Aller sur le site internet 
2. Choisis ton mode :

   * **Preset Tabata (20/10)**
   * **4 Fantastiques**
   * **Personnalisé**
3. Clique sur **Démarrer** et c’est parti !

---

## 🔐 Compatibilité

Fonctionne sur la plupart des navigateurs modernes.

> L’API Wake Lock (empêcher la mise en veille) peut demander une interaction utilisateur ou ne pas être supportée sur certains appareils.

---

## 📁 Structure du projet

```
index.html         # Page principale avec le mode Tabata, 4 fantastiques et un mode personnalisable
4fantastiques.html # Page dédiée au mode "4 Fantastiques"
mentions-legales.html # Page de mentions légales
README.md          # Documentation du projet
```

---

## 📬 Contact

Pour toute demande : **contact@hugo-lembrez.fr**

---

## 🧠 Auteur

Projet créé par **Hugo** — pour un usage sportif simple et fonctionnel.

