# Deployment Architecture

This document describes the verified deployment pipeline for the Personal Knowledge Vault application. The primary target platform is Vercel, with Supabase as the backend platform. The deployment process is split into two main steps:

1. **Application Deployment** – Hosting the Next.js SPA on Vercel
2. **Backend Setup** – Supabase project, database schema, and storage bucket configuration

## 1. Application Deployment on Vercel

### 1.1 Prerequisites

| Item | Details |
|------|---------|
| Vercel Account | Must have an account and the Vercel CLI installed (optional – can be done via dashboard) |
| GitHub Repository | Project source code should be pushed to GitHub (public or private) |
| Environment Variables | All required `NEXT_PUBLIC_*` variables plus `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY` (if used) should be set in Vercel settings |

### 1.2 Vercel Project Configuration (Verified)

From the repository:

- Vercel automatically detects the **next** framework.
- `next.config.js` contains a `reactStrictMode` flag and an `images` remote pattern for Supabase CDN.
- The `build` script is defined as `next build`.
- There is no custom `output` configuration.

No additional Vercel configuration files (`vercel.json`) are present.

### 1.3 Deploy Workflow

**Manual Deploy Steps (via Vercel Dashboard)**

1. **Create Project** – Connect your GitHub repository.
2. **Build Settings** – Ensure the build command is `npm run build` and the output directory is `.next`.
3. **Environment Variables** – Configure the following keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_SECRET`
   - `OPENAI_API_KEY` (if enabled)
   - `NEXT_PUBLIC_APP_URL` (set to deployed domain, e.g., `https://personal-knowledge-vault.vercel.app`)
   - `NEXT_PUBLIC_MAX_FILE_SIZE` (10 MB)
   - `NEXT_PUBLIC_STORAGE_QUOTA` (1 GB)
4. **Deploy** – Trigger a deploy or push to `main`.

**Automatic Deploys** are possible if the GitHub integration is set to auto-deploy on main branch commits.

### 1.4 HTTPS & CORS

- Vercel provides automatic HTTPS via Let's Encrypt.
- For any CORS settings, the application does not expose any server‑side API endpoints that require Cross‑origin requests; all API calls are directed to Supabase, which handles CORS.

## 2. Backend Setup – Supabase

### 2.1 Supabase Project & Configuration

| Item | Status |
|------|--------|
| Supabase Project | `rbvzilbifkdloeffabyb` (verified via .env.example)
| Database | PostgreSQL 15 (default, includes `pgvector` extension via `DATABASE_SETUP.md`)
| Auth | Email/password enabled | yes |
| Storage | Bucket `vault-files` (private bucket) | created via `DATABASE_SETUP.md` (but must be run) |
| RLS (Row Level Security) | Enabled on all tables | yes |
| Database schema | Created via `supabase/schema.sql` | yes |

The user should run the SQL scripts in Supabase SQL Editor or `psql` to create tables and RLS policies.

### 2.2 Storage Bucket Policies

The bucket `vault-files` has the following policies (verified via `DATABASE_SETUP.md`):

- **Upload** – Authenticated users can upload to `vault-files/{user_id}/`.
- **Read** – Authenticated users can read from `vault-files/{user_id}/`.
- **Delete** – Authenticated users can delete from `vault-files/{user_id}/`.

These are enforced through policies that compare the stored path segment to the authenticated UID.

### 2.3 Service Role Key

- The `SUPABASE_SERVICE_ROLE_KEY` is required only in server‑side code. In this project, the key is used by `supabaseAdmin()` in `src/lib/supabase.ts`.
- It is never exposed to the client bundle because it is loaded only in `src/lib/supabase.ts` which runs in a `node` environment and `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the public key used in the client.
- At deployment time on Vercel, the key must be set as an environment variable (not in the repo).

## 3. Deployment Checklist (For Release)

```text
1. Verify that the next.config.js, tailwind.config.js, and postcss.config.js are correctly set.
2. Ensure all environment variables are present in .env.local and in Vercel dashboard.
3. Run `npm install` and `npm run build` locally.
4. Commit the built artifacts (via VCS) – not required for Vercel.
5. Deploy to Vercel – monitor build logs.
6. Verify the production URLs in authentification configuration on Supabase.
7. Test sign‑in, file upload, and search.
8. Check 404/500 error handling.
9. Confirm HTTPS and correct cookie flags.
10. Enable environment monitoring/logging where applicable.
```"
