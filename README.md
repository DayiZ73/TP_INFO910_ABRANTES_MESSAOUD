# Letterboxd Group Watchlist Analyzer

## Membres du binôme
- ABRANTES ALFREDO Gabriel, MESSAOUD-DJEBARA Ziyad

## Description de l'application

**Movie Harmony Finder** est une application web qui permet de trouver les films communs dans les watchlists Letterboxd de plusieurs utilisateurs. L'application analyse les listes de films à voir et les films déjà vus pour recommander les meilleurs films à regarder en groupe.

### Architecture

L'application est composée de trois conteneurs :
- **Frontend** : Interface React + TypeScript avec design inspiré de Letterboxd
- **Backend** : API REST Node.js/Express avec scraping Letterboxd
- **MongoDB** : Base de données pour le cache des watchlists et les groupes d'amis

### Fonctionnalités

1. **Analyse de watchlists** : Entrez plusieurs pseudos Letterboxd et obtenez les films communs
2. **Algorithme de tri intelligent** : Les films sont triés par pertinence selon :
   - Nombre d'utilisateurs ayant le film en watchlist
   - Nombre d'utilisateurs l'ayant déjà vu
   - Priorité (films non vus par tous > films non vus par la majorité > etc.)
3. **Groupes d'amis** : Sauvegardez vos groupes pour les réutiliser
4. **Cache 24h** : Les données Letterboxd sont mises en cache pour éviter trop de requêtes
5. **Deux modes d'affichage** : Vue grille (affiches) ou vue liste (tableau)
6. **Indicateurs visuels** :
   - 👥 Nombre d'utilisateurs ayant le film en watchlist
   - 👁️ Nombre d'utilisateurs ayant vu le film
   - ⭐ Note Letterboxd moyenne (si disponible)

## Utilisation de l'application

### Interface Web

Une fois l'application déployée, accédez à l'interface web :

**Avec Docker Compose** : http://localhost:5173
**Avec Kubernetes** : http://localhost:30090 (ou via minikube service)

#### Créer une analyse

1. Cliquez sur "Create New Group"
2. Entrez les pseudos Letterboxd (minimum 2 utilisateurs)
3. (Optionnel) Cochez "Save as group" et donnez un nom au groupe
4. Cliquez sur "Analyze Watchlists"
5. Consultez les résultats triés par pertinence

#### Gérer les groupes

- Sur la page d'accueil, visualisez tous vos groupes sauvegardés
- Cliquez sur "Analyze" pour relancer une analyse
- Supprimez les groupes avec l'icône de corbeille

### API REST

L'API expose les endpoints suivants :

#### Analyser des watchlists
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"users": ["username1", "username2", "username3"]}'
```

#### Lister les groupes
```bash
curl http://localhost:3000/api/groups
```

#### Créer un groupe
```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -d '{"name": "Movie Night", "users": ["username1", "username2"]}'
```

#### Analyser un groupe existant
```bash
curl -X POST http://localhost:3000/api/groups/{id}/analyze
```

#### Supprimer un groupe
```bash
curl -X DELETE http://localhost:3000/api/groups/{id}
```

## Déploiement Local avec Docker Compose

### Prérequis
- Docker
- Docker Compose

### Étapes

1. **Cloner le dépôt**
```bash
git clone <url-du-depot>
cd INFO910
```

2. **Construire et lancer l'application**
```bash
docker-compose up -d --build
```

3. **Vérifier que les conteneurs sont en cours d'exécution**
```bash
docker-compose ps
```

4. **Accéder à l'application**
- Frontend : http://localhost:5173
- Backend API : http://localhost:3000
- MongoDB : localhost:27017

5. **Voir les logs**
```bash
docker-compose logs -f
```

6. **Arrêter l'application**
```bash
docker-compose down
```

## Déploiement sur Kubernetes

### Prérequis
- Kubernetes cluster (minikube, kind, ou cluster distant)
- kubectl configuré

### Étapes de déploiement

#### 1. Démarrer votre cluster Kubernetes (si vous utilisez minikube)
```bash
minikube start
```

#### 2. Construire les images Docker

```bash
# Configurer Docker pour utiliser le daemon de minikube
eval $(minikube docker-env)

# Construire l'image du backend
docker build -t letterboxd-analyzer-backend:latest ./backend

# Construire l'image du frontend
docker build -t letterboxd-analyzer-frontend:latest ./frontend
```

#### 3. Déployer sur Kubernetes

**Option 1 : Déploiement en une commande**
```bash
kubectl apply -f k8s/
```

**Option 2 : Déploiement manuel dans l'ordre**

a. MongoDB (base de données + stockage)
```bash
kubectl apply -f k8s/mongodb-pv.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/mongodb-service.yaml
```

b. Backend (API)
```bash
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
```

c. Frontend (interface web)
```bash
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

#### 4. Vérifier le déploiement
```bash
# Vérifier les pods
kubectl get pods

# Vérifier les services
kubectl get services

# Vérifier les logs
kubectl logs -l app=backend
kubectl logs -l app=frontend
```

#### 5. Accéder à l'application

**Avec minikube :**
```bash
# Obtenir l'URL du frontend
minikube service frontend --url

# Ou utiliser le port forwarding
kubectl port-forward service/frontend 5173:80
```

Puis ouvrez http://localhost:5173 dans votre navigateur.

**Avec un cluster standard :**
Le frontend est exposé sur le NodePort 30090 :
```bash
curl http://<node-ip>:30090
```

#### 6. Tester l'application

1. Ouvrez l'interface web dans votre navigateur
2. Créez un nouveau groupe avec 2-3 utilisateurs Letterboxd
3. Lancez l'analyse
4. Consultez les films communs triés par pertinence

### Nettoyage
```bash
# Supprimer tous les objets Kubernetes
kubectl delete -f k8s/

# Ou supprimer individuellement
kubectl delete deployment frontend backend mongodb
kubectl delete service frontend backend mongodb
kubectl delete configmap backend-config
kubectl delete pvc mongodb-pvc
kubectl delete pv mongodb-pv
```

## Structure du projet

```
INFO910/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── letterboxdService.js    # Scraping Letterboxd
│   │   │   └── analyzeService.js       # Algorithme de tri
│   │   └── index.js                    # API Express
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UserInputField.tsx      # Saisie des utilisateurs
│   │   │   ├── GroupList.tsx           # Liste des groupes
│   │   │   ├── MovieCard.tsx           # Carte film (vue grille)
│   │   │   ├── MovieList.tsx           # Liste films (vue tableau)
│   │   │   ├── LoadingSpinner.tsx      # Indicateur de chargement
│   │   │   └── StatsBar.tsx            # Barre de statistiques
│   │   ├── pages/
│   │   │   ├── Home.tsx                # Page d'accueil
│   │   │   ├── CreateGroup.tsx         # Création de groupe
│   │   │   └── Results.tsx             # Résultats d'analyse
│   │   ├── services/
│   │   │   └── api.ts                  # Client API
│   │   ├── types/
│   │   │   └── index.ts                # Types TypeScript
│   │   ├── App.tsx                     # Composant racine
│   │   ├── main.tsx                    # Point d'entrée
│   │   └── index.css                   # Styles Tailwind
│   ├── Dockerfile
│   ├── nginx.conf                      # Configuration Nginx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── k8s/
│   ├── mongodb-pv.yaml                 # PersistentVolume MongoDB
│   ├── mongodb-deployment.yaml         # Déploiement MongoDB
│   ├── mongodb-service.yaml            # Service MongoDB
│   ├── backend-configmap.yaml          # Configuration backend
│   ├── backend-deployment.yaml         # Déploiement backend (2 replicas)
│   ├── backend-service.yaml            # Service backend (ClusterIP)
│   ├── frontend-deployment.yaml        # Déploiement frontend (2 replicas)
│   └── frontend-service.yaml           # Service frontend (NodePort)
│
├── docker-compose.yml                  # Configuration Docker Compose
└── README.md                           # Ce fichier
```

## Ressources Kubernetes

### MongoDB
- **PersistentVolume** : 1Gi de stockage pour la base de données
- **Deployment** : 1 replica avec volume persistant
- **Service** : ClusterIP (interne uniquement)

### Backend
- **Deployment** : 2 replicas pour la haute disponibilité
- **Service** : ClusterIP (accessible uniquement depuis le cluster)
- **ConfigMap** : Configuration de l'URI MongoDB
- **Health checks** : Liveness et Readiness probes sur /health

### Frontend
- **Deployment** : 2 replicas pour la haute disponibilité
- **Service** : NodePort exposé sur le port 30090
- **Nginx** : Serveur web avec reverse proxy vers le backend

## Algorithme de tri des films

Les films sont triés par priorité décroissante :

| Priorité | Description | Conditions |
|----------|-------------|------------|
| 1 | Tous les utilisateurs l'ont en watchlist | Non vu par personne |
| 2 | Majorité (≥60%) l'ont en watchlist | Non vu par personne |
| 3 | Certains (≥30%) l'ont en watchlist | Non vu par personne |
| 4 | Tous les utilisateurs l'ont en watchlist | Vu par certains |
| 5 | Majorité l'ont en watchlist | Vu par certains |
| 6 | Autres combinaisons | - |

## Modèle de données

### Collection `users` (MongoDB)
```json
{
  "_id": "letterboxd_username",
  "watchlist": [
    {
      "id": "12345",
      "slug": "inception",
      "title": "Inception",
      "posterUrl": "https://..."
    }
  ],
  "watched": ["12345", "67890"],
  "updatedAt": "2025-10-10T12:00:00Z"
}
```

### Collection `groups` (MongoDB)
```json
{
  "_id": ObjectId("..."),
  "name": "Movie Night Friends",
  "users": ["user1", "user2", "user3"],
  "createdAt": "2025-10-10T10:00:00Z"
}
```

## Technologies utilisées

| Composant | Technologies |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, React Router, Axios, Lucide Icons |
| **Backend** | Node.js 18, Express 4, MongoDB Driver, Axios, Cheerio |
| **Base de données** | MongoDB 7.0 |
| **Conteneurisation** | Docker, Docker Compose |
| **Orchestration** | Kubernetes |
| **Web Server** | Nginx (pour le frontend) |

## Troubleshooting

### Les pods ne démarrent pas
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Le backend ne peut pas scraper Letterboxd
- Vérifiez que les utilisateurs Letterboxd existent
- Vérifiez les logs du backend : `kubectl logs -l app=backend`
- Letterboxd peut bloquer trop de requêtes (utilisez le cache)

### Le frontend ne peut pas communiquer avec le backend
```bash
# Vérifier que le service backend est accessible
kubectl get svc backend

# Tester depuis un pod frontend
kubectl exec -it <frontend-pod> -- sh
curl http://backend:3000/health
```

### Problèmes de cache
Les données sont mises en cache pendant 24h. Pour forcer un refresh, supprimez les données utilisateur en base :
```bash
kubectl exec -it <mongodb-pod> -- mongosh letterboxd_analyzer
db.users.deleteMany({})
```

### Redémarrer un déploiement
```bash
kubectl rollout restart deployment/frontend
kubectl rollout restart deployment/backend
kubectl rollout restart deployment/mongodb
```

## Limitations et améliorations futures

### Limitations actuelles
- Pas d'authentification OAuth Letterboxd (scraping uniquement)
- Rate limiting basique (risque de blocage si trop de requêtes)
- Scraping limité à la première page de watchlist
- Pas de support des listes privées

### Améliorations futures (v2)
- Authentification OAuth Letterboxd
- Pagination complète des watchlists
- Filtres avancés (genre, année, durée, note)
- Historique des analyses
- Statistiques de groupe (genres préférés, réalisateurs communs)
- Système de recommandations personnalisées
- Export des résultats (PDF, CSV)
- Notifications pour nouveaux films communs
- Mode "soirée ciné" avec sélection aléatoire

## Contribution

Ce projet a été réalisé dans le cadre du cours INFO910 - Conteneurisation et Kubernetes.

## Licence

MIT
