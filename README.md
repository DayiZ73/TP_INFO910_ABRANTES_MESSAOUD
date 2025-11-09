# Letterboxd Group Watchlist Analyzer

## Membres du binôme
- ABRANTES ALFREDO Gabriel
- MESSAOUD-DJEBARA Ziyad

## Description de l'application

**Movie Harmony Finder** est une application web qui permet de trouver les films communs dans les watchlists Letterboxd de plusieurs utilisateurs. L'application analyse les listes de films à voir et les films déjà vus pour recommander les meilleurs films à regarder en groupe.

### Architecture

L'application est composée de trois conteneurs :
- **Frontend** : Interface React + TypeScript
- **Backend** : API REST Node.js/Express avec scraping Letterboxd
- **MongoDB** : Base de données pour le cache des watchlists et les groupes

### Fonctionnalités principales

- Analyse de watchlists de plusieurs utilisateurs Letterboxd
- Algorithme de tri intelligent par pertinence (films non vus prioritaires)
- Sauvegarde de groupes d'amis pour réutilisation
- Cache des données pendant 24h
- Deux modes d'affichage : grille (affiches) et liste (tableau)

## Utilisation de l'application

Une fois l'application déployée, accédez à l'interface web :
- **Avec Docker Compose** : http://localhost:5173
- **Avec Kubernetes** : http://localhost:30090

### Étapes d'utilisation

1. Cliquez sur "Create New Group"
2. Entrez les pseudos Letterboxd (minimum 2 utilisateurs)
3. (Optionnel) Cochez "Save as group" et donnez un nom au groupe
4. Cliquez sur "Analyze Watchlists"
5. Consultez les résultats triés par pertinence

## Déploiement Local avec Docker Compose

**Prérequis** : Docker et Docker Compose installés

```bash
# Lancer l'application
docker-compose up -d --build

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f

# Arrêter l'application
docker-compose down
```

**Accès** : http://localhost:5173

## Déploiement sur Kubernetes

**Prérequis** : Cluster Kubernetes (minikube, kind, ou cluster distant) et kubectl configuré

### 1. Démarrer le cluster (avec minikube)
```bash
minikube start
```

### 2. Construire les images Docker
```bash
# Configurer Docker pour minikube
eval $(minikube docker-env)

# Construire les images
docker build -t letterboxd-analyzer-backend:latest ./backend
docker build -t letterboxd-analyzer-frontend:latest ./frontend
```

### 3. Déployer l'application
```bash
# Déployer tous les composants
kubectl apply -f k8s/

# Vérifier le déploiement
kubectl get pods
kubectl get services
```

### 4. Accéder à l'application

**Avec minikube :**
```bash
minikube service frontend --url
```

**Avec un cluster standard :**
```
http://<node-ip>:30090
```

### 5. Nettoyage
```bash
kubectl delete -f k8s/
```

## Technologies utilisées

- **Frontend** : React 18, TypeScript, Vite, TailwindCSS
- **Backend** : Node.js, Express, Cheerio (web scraping)
- **Base de données** : MongoDB 7.0
- **Conteneurisation** : Docker, Docker Compose
- **Orchestration** : Kubernetes

---

*Projet réalisé dans le cadre du cours INFO910 - Conteneurisation et Kubernetes*
