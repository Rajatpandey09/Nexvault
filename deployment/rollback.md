# Rollback Strategy

This document outlines the current rollback capabilities for the Personal Knowledge Vault application, covering both the front‑end (Next.js) and the back‑end (Supabase). It also identifies gaps where rollback support is missing.

## 1. Front‑End Rollback (Next.js on Vercel)

### 1.1 Vercel Deploy Previews

- **Automatic Previews** – Every commit creates a preview URL (`<commit‑sha>‑<project>.vercel.app`).
- **Instant Revert** – By clicking "Rollback" in Vercel’s deployment history, you can redeploy a previous successful build.
- **Verified** – This is the default Vercel behavior.

### 1.2 Manual Rollback Procedure

1. **Navigate** to the Vercel dashboard for the project.
2. **Open** the *Deployments* tab.
3. **Select** a previous successful deployment.
4. Click **Rollback** – Vercel creates a new production deployment from that snapshot.
5. Verify the site works as expected.

### 1.3 Gap: Automatic Zero‑Downtime Rollback

- Vercel performs a **rolling deploy**; there is no built‑in zero‑downtime guarantee for large apps.
- **Missing**: Canary or blue‑green deployment strategy for staged rollout.

## 2. Database Rollback (Supabase / PostgreSQL)

### 2.1 Supabase Backups (Verified)

- Supabase provides **daily automated backups** for the entire database (via the UI).
- Backups can be **restored** to a new project or overwritten onto the existing project.
- **Retention** is typically 7‑30 days on the free tier (subject to plan).

### 2.2 Manual Point‑In‑Time Recovery (Not Configured)

- Supabase’s free tier does **not** support point‑in‑time recovery (PITR).
- To enable PITR you would need to upgrade to a paid tier.

### 2.3 Database Migrations

- The repo does **not** contain a migration system (e.g., `drizzle`, `prisma`, or `sqlx`).
- Schema changes are applied manually via the SQL editor per the instructions in `DATABASE_SETUP.md`.
- **Missing**: Automated migration scripts for version control of schema changes.

### 2.4 Rollback Scenarios

| Scenario | Current Capability | Required Action |
|----------|--------------------|-----------------|
| **Schema change** (e.g., new column) | Manual SQL script; no automated rollback | Write a reversible migration script (add column + `DROP COLUMN`) and store in version control |
| **Critical data corruption** | Restore from Supabase daily backup (manual) | Initiate a backup restore via Supabase UI; may cause downtime |
| **Accidental data deletion** | No soft‑delete for files/notes/links (soft‑delete is implemented via `is_deleted` flag) | Use soft‑delete recovery: set `is_deleted = false`. For hard deletes, rely on backups |

## 3. Storage Rollback (Supabase Storage)

- Files are stored in the **private bucket** `vault-files` with a path per user (`{user_id}/{hash}.{ext}`).
- Supabase Storage does **not** provide versioning.
- Deleting a file via the UI or API is permanent.

### Gap: File Versioning

- **Missing**: Versioned storage or a “trash” bucket for deleted files.
- **Potential Mitigation**: Implement a manual “trash” soft delete by moving the file to a `trash/` folder in the bucket.

## 4. Application‑Level Rollback (Soft‑Delete & Recovery)

### 4.1 Soft‑Delete Implementation (Verified)

- All data entities (`files`, `notes`, `links`) have an `is_deleted` boolean and `deleted_at` timestamp.
- UI components (`moveToTrash`) set `is_deleted = true` – allowing recovery via a future UI (not yet implemented).

### 4.2 Missing UI for Restore

- The current UI does **not** include a “Trash” view where users can restore items.
- The `Trash` page exists (`src/app/dashboard/trash/page.tsx`) but implementation details are missing from the provided code.

## 5. Summary of Existing Rollback Capabilities

| Layer | Capability | Verified |
|-------|------------|----------|
| Front‑end (Vercel) | Deploy preview + manual rollback via dashboard | ✅ |
| Database (Supabase) | Daily backups, manual restore | ✅ |
| Storage (Supabase) | No versioning, permanent delete | ❌ |
| Application data | Soft‑delete (`is_deleted`) for files/notes/links | ✅ |
| Migration scripts | None – schema changes are manual | ❌ |

## 6. Recommendations (Prioritized)

1. **Add Migration Framework** – e.g., `drizzle` or `prisma` migrations stored in `schema/migrations/` to allow reproducible rollbacks of schema changes.
2. **Implement Trash UI** – Provide a page to list soft‑deleted items and a restore button that flips `is_deleted` back to `false`.
3. **Introduce Storage Versioning** – Either via a custom versioning scheme (store previous file versions under a `versions/` folder) or switch to a storage provider with built‑in versioning.
4. **Enable PITR** – Upgrade Supabase plan to get point‑in‑time recovery for critical production databases.
5. **Automate Backup Validation** – Periodically test restoring a backup to a staging project.
6. **Add Canary Deployments** – Use Vercel’s preview environment as a canary and promote to production after verification.

---

*All statements are based on the current repository state and Supabase/Vercel documentation as of the analysis date.*