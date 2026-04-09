Here is your **🐳 DOCKER_SETUP.md** — clean, simple, and reviewer-ready 👇

---

# 🐳 DOCKER_SETUP.md

## 📌 Purpose

Defines how the entire system runs using **Docker Compose (tool to run multiple services together)**

👉 One command should start everything:

```
docker compose up
```

---

# 🏗️ Services Overview

The system has **3 services**:

| Service  | Tech              | Purpose                 |
| -------- | ----------------- | ----------------------- |
| db       | PostgreSQL        | Database                |
| backend  | Node.js + Express | APIs + WebSocket + Jobs |
| frontend | React             | UI                      |

---

# 📦 docker-compose.yml

```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    container_name: wtf_db
    environment:
      POSTGRES_DB: wtf_livepulse
      POSTGRES_USER: wtf
      POSTGRES_PASSWORD: wtf_secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/db/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wtf"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: wtf_backend
    environment:
      DATABASE_URL: postgres://wtf:wtf_secret@db:5432/wtf_livepulse
      PORT: 3001
      NODE_ENV: development
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy
    command: node src/app.js

  frontend:
    build: ./frontend
    container_name: wtf_frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

# 🧱 Backend Dockerfile

Path:

```
backend/Dockerfile
```

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "src/app.js"]
```

---

# 🎨 Frontend Dockerfile

Path:

```
frontend/Dockerfile
```

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
```

---

# 🔁 Startup Flow

When you run:

```
docker compose up
```

### Step-by-step:

1. **PostgreSQL starts**
2. Runs SQL files from:

   ```
   /docker-entrypoint-initdb.d
   ```

   👉 seeds database automatically
3. **Backend starts**

   * connects to DB
   * starts APIs + WebSocket + jobs
4. **Frontend starts**

   * connects to backend

---

# ⚡ Important Rules

## 1. Auto Seed Required

* DB must auto-run seed script
* No manual commands

---

## 2. Idempotent Seed

* Running twice → no duplicate data

---

## 3. Zero Manual Setup

Reviewer should ONLY run:

```
docker compose up
```

---

## 4. Health Check Dependency

Backend waits for DB:

```yaml
depends_on:
  db:
    condition: service_healthy
```

---

# 🌍 Ports

| Service  | Port |
| -------- | ---- |
| Frontend | 3000 |
| Backend  | 3001 |
| DB       | 5432 |

---

# 🧪 Verification Checklist

After running:

```
docker compose up
```

Check:

* ✅ Frontend opens → [http://localhost:3000](http://localhost:3000)
* ✅ Backend running → [http://localhost:3001](http://localhost:3001)
* ✅ DB seeded → 5000 members
* ✅ Live occupancy visible
* ✅ Anomalies generated

---

