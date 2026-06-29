# GreenLife Frontend — Deployment Guide

**Version**: 1.0.0
**Framework**: React 19 + TypeScript + Vite 6
**Audit Date**: 2026-06-22

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 18.0.0 | LTS recommended |
| npm | ≥ 9.0.0 | Bundled with Node.js |
| Git | Any | For source checkout |

---

## Environment Variables

Copy `.env.example` to `.env` and populate all values before running any build:

```env
# API backend base URL (no trailing slash)
# Leave empty to use relative URLs (when frontend & backend are co-hosted)
VITE_API_BASE_URL=https://api.greenlife.vn

# Request timeout in milliseconds (default: 15000)
VITE_API_TIMEOUT=15000
```

> [!IMPORTANT]
> Never commit `.env` files containing real secrets. Only commit `.env.example`.

---

## Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd swp391-su26-ai-audit-project-swp391_se20a04_group-05-3/greenlife-frontend

# 2. Install dependencies
npm install

# 3. Copy and configure environment
cp .env.example .env
# Edit VITE_API_BASE_URL to point to your local backend (e.g., http://localhost:8080)

# 4. Start development server
npm run dev
```

The dev server runs at **http://localhost:3000**.

API requests to `/api/*` are proxied to `http://localhost:5000` via Vite's built-in proxy (configured in `vite.config.ts`).

---

## Staging Deployment (Vercel)

The repository includes a `vercel.json` configuration.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to preview (staging)
vercel

# Deploy to production alias
vercel --prod
```

### Vercel Environment Variables

Set these in the Vercel project dashboard under **Settings → Environment Variables**:

| Variable | Value | Environment |
|---|---|---|
| `VITE_API_BASE_URL` | `https://staging-api.greenlife.vn` | Preview |
| `VITE_API_TIMEOUT` | `15000` | All |

### `vercel.json` Configuration

The existing `vercel.json` should include SPA rewrite rules:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

> [!NOTE]
> This is necessary because GreenLife is a Single Page Application — all routes must be served from `index.html`.

---

## Production Deployment

### Step 1: Build the production bundle

```bash
cd greenlife-frontend

# Ensure production env is set
cp .env.example .env
# Set VITE_API_BASE_URL=https://api.greenlife.vn

# Clean install and build
npm ci
npm run build
```

Build artifacts are generated in `dist/`.

### Step 2: Serve static files

The `dist/` folder is a fully static site. Serve it with any HTTP server:

**Nginx example**:
```nginx
server {
    listen 80;
    server_name greenlife.vn;

    root /var/www/greenlife/dist;
    index index.html;

    # SPA routing — all routes fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets (JS/CSS chunks) aggressively
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Docker example**:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## Smoke Tests (Post-Deployment)

After deploying to any environment, run these manual checks:

| Check | Expected | Notes |
|---|---|---|
| Home page loads | 200 OK, renders hero section | Check for blank screen |
| `/shop` loads products | Product grid renders, no spinner stuck | Wait max 5s |
| Login with valid credentials | Redirects to customer dashboard | Backend must be up |
| Guest can access AI Diagnosis | Page renders without auth challenge | Policy: public |
| Guest can browse Expert Directory | Page renders without auth challenge | Policy: public |
| Guest accessing `/customer-dashboard` | Redirected to `/auth` | ProtectedRoute works |
| Admin dashboard inaccessible to guest | No admin content visible | RBAC enforced |
| Cart drawer opens on add-to-cart | Drawer slides in, item visible | |
| Toast notification appears | Visible in top-right for 4 seconds | react-hot-toast |
| Dark mode toggle works | Theme switches and persists on reload | localStorage |

---

## Rollback Procedures

### Vercel Rollback
```bash
# List recent deployments
vercel ls

# Promote a previous deployment URL to production
vercel alias set <previous-deployment-url> greenlife.vn
```

### Manual Rollback
1. Keep a copy of the previous `dist/` folder in your CI artifacts
2. Stop the current deployment
3. Replace `dist/` with the backup copy
4. Restart the web server

### Emergency Configuration Rollback
If a broken environment variable caused the issue:
1. Revert `VITE_API_BASE_URL` in your environment settings
2. Trigger a new build — it will pick up the old value
3. Deploy the new build

---

## CI/CD Checklist (GitHub Actions example)

```yaml
name: Deploy GreenLife Frontend

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: greenlife-frontend/package-lock.json

      - name: Install dependencies
        working-directory: greenlife-frontend
        run: npm ci

      - name: TypeScript check
        working-directory: greenlife-frontend
        run: npx tsc --noEmit

      - name: Build
        working-directory: greenlife-frontend
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: greenlife-frontend
          vercel-args: '--prod'
```
