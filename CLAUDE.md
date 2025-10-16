# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Movie Harmony Finder** - A Letterboxd watchlist analyzer that finds common movies across multiple users' watchlists to help groups decide what to watch together. The application scrapes Letterboxd profiles, caches data, and uses a priority-based algorithm to rank movies by group relevance.

## Architecture

Three-tier containerized application:

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS (served via Nginx)
- **Backend**: Node.js Express API with web scraping (Cheerio + Axios)
- **Database**: MongoDB 7.0 for caching watchlists and storing user groups

## Development Commands

### Docker Compose (Recommended for local development)

```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Access:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3000
# - MongoDB: localhost:27017
```

### Kubernetes Deployment

```bash
# Using minikube
minikube start
eval $(minikube docker-env)

# Build images (required when using minikube)
docker build -t letterboxd-analyzer-backend:latest ./backend
docker build -t letterboxd-analyzer-frontend:latest ./frontend

# Deploy all resources
kubectl apply -f k8s/

# Check status
kubectl get pods
kubectl get services

# Access frontend
minikube service frontend --url
# Or via NodePort: http://<node-ip>:30090

# View logs
kubectl logs -l app=backend
kubectl logs -l app=frontend

# Cleanup
kubectl delete -f k8s/
```

### Local Development (without Docker)

**Backend:**
```bash
cd backend
npm install
npm run dev          # Development with nodemon
npm start            # Production mode
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # Development server (Vite)
npm run build        # TypeScript compile + production build
npm run preview      # Preview production build
```

## Key Technical Details

### Backend Services Architecture

The backend is structured around two core services in `backend/src/services/`:

1. **letterboxdService.js** - Web scraping layer
   - Scrapes user profiles, watchlists, and watched films from Letterboxd
   - Implements 1-second rate limiting between requests (`REQUEST_DELAY`)
   - Uses Cheerio to parse HTML and extract film data (id, slug, title, posterUrl)
   - 24-hour cache TTL (`CACHE_TTL = 24 * 60 * 60 * 1000`)
   - User-Agent spoofing to avoid being blocked

2. **analyzeService.js** - Movie ranking algorithm
   - Calculates common movies across multiple users' watchlists
   - Implements a 6-tier priority system based on watchlist ratio and watched ratio
   - Priority 1 (highest): All users have it on watchlist, none watched
   - Priority 6 (lowest): Low watchlist ratio or already watched by many

### API Endpoints

All endpoints are in `backend/src/index.js`:

- `POST /api/analyze` - Analyze multiple users' watchlists
- `GET /api/users/:username/validate` - Check if Letterboxd user exists
- `GET /api/groups` - List all saved groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get specific group
- `DELETE /api/groups/:id` - Delete a group
- `POST /api/groups/:id/analyze` - Analyze an existing group
- `GET /health` - Health check endpoint

### Data Models

**MongoDB Collections:**

1. `users` - Cached Letterboxd data
   - `_id`: Letterboxd username (string)
   - `watchlist`: Array of movie objects
   - `watched`: Array of film IDs (strings)
   - `updatedAt`: Timestamp for cache invalidation

2. `groups` - Saved user groups
   - `_id`: MongoDB ObjectId
   - `name`: Group name (string)
   - `users`: Array of Letterboxd usernames
   - `createdAt`: Timestamp

### Frontend Structure

- **Pages** (`frontend/src/pages/`):
  - `Home.tsx` - Group list and dashboard
  - `CreateGroup.tsx` - Form to create new analysis/group
  - `Results.tsx` - Movie results with grid/list view toggle

- **Components** (`frontend/src/components/`):
  - `UserInputField.tsx` - Username input with real-time validation
  - `GroupList.tsx` - Display saved groups
  - `MovieCard.tsx` - Grid view film card with poster
  - `MovieList.tsx` - Table view with detailed stats
  - `StatsBar.tsx` - Analysis statistics display
  - `LoadingSpinner.tsx` - Loading indicator

- **Services** (`frontend/src/services/`):
  - `api.ts` - Axios client for backend communication

### Environment Variables

**Backend** (via `k8s/backend-configmap.yaml` or `docker-compose.yml`):
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://mongodb:27017`)
- `PORT`: API server port (default: `3000`)

**Frontend** (build-time):
- `VITE_API_URL`: Backend API URL (default: `http://localhost:3000`)

### Kubernetes Resources

- **MongoDB**: 1Gi PersistentVolume, ClusterIP service (internal only)
- **Backend**: 2 replicas with liveness/readiness probes on `/health`, ClusterIP service
- **Frontend**: 2 replicas, NodePort service on port 30090
- Nginx reverse proxy in frontend container routes `/api` to backend service

### Movie Priority Algorithm

The sorting algorithm in `analyzeService.js` uses a 6-tier priority system:

| Priority | Watchlist Ratio | Watched Ratio | Description |
|----------|----------------|---------------|-------------|
| 1 | 100% (1.0) | 0% | Everyone wants it, nobody watched |
| 2 | ≥60% (≥0.6) | 0% | Majority wants it, nobody watched |
| 3 | ≥30% (≥0.3) | 0% | Some want it, nobody watched |
| 4 | 100% (1.0) | >0% | Everyone wants it, some watched |
| 5 | ≥60% (≥0.6) | >0% | Majority wants it, some watched |
| 6 | Other | Other | Everything else |

Within each priority tier, movies are further sorted by watchlist count (descending) then watched count (ascending).

## Important Development Notes

### Rate Limiting
Letterboxd scraping includes a 1-second delay between requests. Do NOT reduce `REQUEST_DELAY` in `letterboxdService.js` as this may trigger rate limiting or IP blocking by Letterboxd.

### Cache Behavior
User watchlists are cached for 24 hours. The backend gracefully handles MongoDB connection failures by running in "validation-only mode" (no caching/groups, but user validation still works).

### TypeScript Types
All shared types are defined in `frontend/src/types/index.ts` (Movie, Group, AnalysisResult interfaces).

### Nginx Configuration
The frontend uses a custom `nginx.conf` that proxies `/api` requests to the backend service, enabling single-origin requests from the browser.
