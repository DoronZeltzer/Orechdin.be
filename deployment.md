# Orechdin-Web Deployment Guide

This repository has been hardened with enterprise legal-tech standards (Better Auth, UploadThing, and SQLite via Drizzle ORM). It is **fail-closed**, meaning everything will fall back safely if secret keys are missing, allowing local environment booting.

## 1. Local Development (Node.js/Next.js)

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Copy `.env.example` to `.env.local`. The local SQLite DB will run natively on the file `local.db` without needing to establish a Docker Postgres image or Turso secret.
   ```bash
   cp .env.example .env.local
   ```
3. **Database Scaffolding** (Optional for local testing if running without keys):
   ```bash
   npx drizzle-kit push
   ```
4. **Boot**:
   ```bash
   npm run dev
   ```

## 2. Replit Deployment

This architecture is optimized for 1-click Replit import:
1. **Import** the private GitHub repository into a new Replit Workspace.
2. Select the **Next.js** template.
3. In the Replit **Secrets** tool, paste the values from `.env.example`.
   - `BETTER_AUTH_SECRET`: Random 32 byte string.
   - `UPLOADTHING_SECRET`: Sourced from uploadthing.com
4. Hit **Run**. Replit automatically provisions the SQLite `.db` file persistently into your workspace storage.

## 3. GitHub Push Operations

If you cloned this locally:
```bash
git add .
git commit -m "feat: implement advanced neo intake blueprint"
git remote add origin https://github.com/YourUsername/NIR-WEBSITE.git
git push -u origin master
```
