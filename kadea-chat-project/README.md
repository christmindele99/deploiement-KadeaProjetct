lien du deploiement de l'application
https://deploiement-kadeaprojetct.onrender.com

lien de la maquette sur Figma
https://www.figma.com/design/7A6nEJBCdmFBqZEPrGckJu/Sans-titre?node-id=2-2&t=hia9zpeH1xrz6M2j-0



# Kadea Chat 💬

**Kadea Chat** est une application web de messagerie instantanée conçue pour faciliter la communication entre utilisateurs à travers une interface moderne, intuitive et responsive.

Inspirée des applications de messagerie populaires, elle permet aux utilisateurs d'échanger des messages en temps réel, de gérer leurs conversations individuelles et de groupe, de personnaliser leur profil et de configurer leurs préférences.

Le projet a été développé dans le cadre du parcours **Full Stack Web Development de Kadea Academy**, avec pour objectif de mettre en pratique les compétences acquises en développement frontend et backend.


## 📌 Sommaire

- [Présentation du projet]
- [Fonctionnalités principales]
- [Technologies utilisées]
- [Architecture du projet]
- [Installation et configuration]
- [Lancement du projet]
- [Sécurité]
- [Déploiement]
- [Perspectives d'amélioration]
- [Auteur]


## 🚀 Présentation du projet

Kadea Chat est une plateforme de communication qui offre un espace d'échange simple et accessible.

L'application met à disposition plusieurs fonctionnalités permettant de communiquer efficacement, notamment :

- La messagerie privée entre utilisateurs.
- La création et la gestion de groupes de discussion.
- L'envoi et la réception de messages en temps réel.
- La gestion des profils utilisateurs.
- La personnalisation de l'expérience utilisateur.
- La gestion de la confidentialité et de la sécurité des comptes.

L'interface propose également un mode clair et un mode sombre afin d'améliorer le confort visuel des utilisateurs.

## ✨ Fonctionnalités principales

### 1. Authentification et gestion des comptes

- Inscription de nouveaux utilisateurs.
- Connexion et déconnexion.
- Vérification des adresses e-mail.
- Protection des accès aux pages privées.
- Gestion des sessions utilisateurs.
- Modification du mot de passe.

### 2. Messagerie instantanée

- Création de conversations individuelles.
- Envoi et réception de messages.
- Actualisation des messages en temps réel.
- Affichage des conversations.
- Gestion des messages envoyés.
- Modification et suppression des messages.
- Sélection de plusieurs messages.
- Suppression groupée des messages.

### 3. Gestion des groupes

- Création de groupes de discussion.
- Ajout et retrait de membres.
- Modification des informations du groupe.
- Personnalisation de l'image du groupe.
- Gestion des administrateurs.
- Consultation des informations et des membres du groupe.

### 4. Gestion du profil utilisateur

- Consultation du profil personnel.
- Modification du nom complet.
- Modification du nom d'utilisateur.
- Modification de la biographie.
- Ajout et modification de la photo de profil.
- Affichage du statut de vérification du compte.

### 5. Paramètres et personnalisation

- Mode clair (Light Mode).
- Mode sombre (Dark Mode).
- Conservation du thème sélectionné.
- Gestion des paramètres de confidentialité.
- Modification du mot de passe depuis les paramètres de confidentialité.

### 6. Interface utilisateur

- Interface inspirée des applications modernes de messagerie.
- Design responsive.
- Navigation intuitive.
- Affichage dynamique des conversations.
- Modales interactives.
- Notifications et retours visuels.
- Expérience utilisateur adaptée aux différents thèmes.

---

## 🛠️ Technologies utilisées

Le projet repose sur plusieurs technologies permettant d'assurer le fonctionnement du frontend, du backend et de la communication en temps réel.

| Technologie  | Utilisation                          |
| ------------ | ------------------------------------ |
| HTML5        | Structure des interfaces             |
| CSS3         | Mise en forme                        |
| JavaScript   | Interactions et logique frontend     |
| Tailwind CSS | Stylisation et responsive design     |
| AdonisJS v7  | Framework backend                    |
| Edge         | Moteur de templates                  |
| Lucid ORM    | Gestion des données                  |
| PostgreSQL   | Base de données relationnelle        |
| Transmit     | Communication en temps réel          |
| Vite         | Gestion des ressources frontend      |
| Cloudinary   | Stockage et gestion des images       |
| Brevo        | Envoi des e-mails                    |
| Git & GitHub | Gestion de versions et collaboration |

---

## 📁 Architecture du projet

Le projet adopte une organisation séparant les responsabilités du frontend, du backend et des ressources de l'application.

Principaux répertoires :

kadea-chat-project/
│
├── app/
│   ├── controllers/
│   ├── models/
│   └── middleware/
│
├── config/
│
├── database/
│   └── migrations/
│
├── resources/
│   ├── views/
│   │   └── pages/
│   └── js/
│       ├── auth/
│       └── chat/
│
├── public/
│
├── start/
│   └── routes.ts
│
├── tests/
│
├── .env.example
├── package.json
└── README.md


## ⚙️ Installation et configuration

Pour installer et exécuter Kadea Chat en local, il est nécessaire de disposer des éléments suivants :

### Prérequis

- Node.js
- npm
- PostgreSQL
- Git

### 1. Cloner le dépôt

terminal :
git clone https://github.com/kadea-academy-learners/26-01-kd-dev-web-matin-c-mon-thu-kin-capstone-kadea-chat-christmindele99
```

### 2. Accéder au projet

terminal
cd kadea-chat-project

### 3. Installer les dépendances

terminal
npm install


### 4. Configurer les variables d'environnement

Créer un fichier `.env` à partir du fichier `.env.example`, puis renseigner les informations nécessaires :

- Configuration de la base de données PostgreSQL.
- Clés et paramètres de l'application.
- Configuration du service d'envoi d'e-mails Brevo.
- Identifiants du service Cloudinary.

**Important :** Les informations sensibles ne doivent jamais être publiées sur GitHub.

### 5. Exécuter les migrations

terminal :
node ace migration:run

Cette commande permet de créer les tables nécessaires au fonctionnement de l'application.


## ▶️ Lancement du projet

Pour démarrer le serveur de développement :

terminal :
npm run dev

L'application sera accessible à l'adresse locale configurée par le serveur.



## 🔐 Sécurité

La sécurité des comptes et des données constitue un aspect important de Kadea Chat.

L'application intègre notamment :

- Le hachage des mots de passe.
- La vérification des adresses e-mail.
- La protection des routes nécessitant une authentification.
- La gestion des sessions utilisateurs.
- La validation des données reçues.
- La gestion des autorisations liées aux groupes.

---

## 🌐 Déploiement

Kadea Chat est conçu pour être déployé dans un environnement de production.

Les services utilisés pour son hébergement et son fonctionnement comprennent :

- **Render :** hébergement de l'application backend.
- **Render PostgreSQL :** hébergement de la base de données.
- **Cloudinary :** gestion des images et avatars.
- **Brevo :** gestion de l'envoi des e-mails.

---

## 🔭 Perspectives d'amélioration

Plusieurs évolutions peuvent être envisagées pour enrichir l'expérience utilisateur :

- Envoi de fichiers et de documents.
- Partage d'images et de vidéos.
- Appels audio et vidéo.
- Notifications push.
- Indicateur de saisie en cours.
- Indicateurs de lecture des messages.
- Recherche avancée dans les conversations.

---

## 👨‍💻 Auteur

**Christ Mindele**

Développeur Full Stack en formation à Kadea Academy et graphiste designer freelance.

Ce projet représente une mise en pratique des compétences acquises en conception d'interfaces, développement frontend, développement backend et gestion de bases de données.

**GitHub :** [christmindele99](https://github.com/christmindele99)

---

## 📄 Licence

Projet développé dans le cadre du parcours de formation Full Stack Web Development de Kadea Academy.

