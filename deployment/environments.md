# Environments

This document describes the environments for the Personal Knowledge Vault application.

## Environment Overview

| Environment | Purpose | URL | Database | Status |
|-------------|---------|-----|----------|--------|
| **Development** | Local development | `http://localhost:3001` (configured in .env.local) | Local Supabase project (rbvzilbifkdloeffabyb.supabase.co) | Active |
| **Staging** | Pre-production testing | Not configured | Not configured | **NOT CONFIGURED** |
| **Production** | Live application | Not deployed | Not deployed | **NOT DEPLOYED** |

## Environment Variables

All environment variables are defined in `.env.example` and should be configured per environment.

### Required Variables

| Variable | Description | Dev Value | Staging | Production | Secret? |
|----------|-------------|-----------|---------|------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://rbvzilbifkdloeffabyb.supabase.co` | TBD | TBD | No (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client-safe) | Present in .env.local | TBD | TBD | No (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, bypasses RLS) | Present in .env.local | TBD | TBD | **YES** |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Not set in .env.local | TBD | TBD | **YES** |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3001` | TBD | TBD | No |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) | TBD | TBD | No |
| `NEXT_PUBLIC_STORAGE_QUOTA` | User storage quota in bytes | `1073741824` (1GB) | TBD | TBD | No |
| `NEXTAUTH_SECRET` | NextAuth.js secret for session encryption | Present in .env.local | TBD | TBD | **YES** |
| `NEXTAUTH_URL` | NextAuth callback URL | Not explicitly set (defaults to NEXT_PUBLIC_APP_URL) | TBD | TBD | No |

### Variable Verification Status

- ✅ **Verified in .env.local**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MAX_FILE_SIZE`, `NEXT_PUBLIC_STORAGE_QUOTA`, `NEXTAUTH_SECRET`
- ❓ **Not configured**: `OPENAI_API_KEY`, `NEXTAUTH_URL`
- 🔴 **Missing for Staging/Production**: All variables need to be configured

## Configuration Differences Between Environments

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| **Supabase Project** | rbvzilbifkdloeffabyb | TBD | TBD |
| **App URL** | `http://localhost:3001` | TBD | TBD |
| **Auth Redirect URLs** | `http://localhost:3001/auth/callback` | TBD | TBD |
| **Storage Bucket** | `vault-files` (dev) | TBD | TBD |
| **OpenAI API** | Not configured | TBD | TBD |
| **HTTPS** | No (localhost) | Yes (required) | Yes (required) |
| **Debug Mode** | Enabled (React strict mode) | Disabled | Disabled |
| **Console Logging** | Verbose | Minimal | Error only |

## Secrets Handling

### Current State

- `.env.local` exists and contains real secret values (checked into local filesystem only)
- `.env.example` exists as template with placeholder values
- `.gitignore` correctly excludes `.env` and `.env*.local` files
- **CRITICAL**: `.env.local` contains actual Supabase keys and NEXTAUTH_SECRET - these are real credentials

### Secret Storage

| Secret | Where Stored | Access |
|--------|--------------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (local), Vercel Environment Variables (prod) | Server-side only via `supabaseAdmin()` function |
| `NEXTAUTH_SECRET` | `.env.local` (local), Vercel Environment Variables (prod) | Server-side only |
| `OPENAI_API_KEY` | Not configured | Would be server-side only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local`, Vercel (public) | Client-safe, exposed to browser |

### Secret Rotation

- No automated rotation process exists
- Manual rotation required if secrets are compromised
- Supabase keys can be rotated in Supabase Dashboard → Settings → API

## Required Services & Dependencies

### External Services

| Service | Purpose | Dev Config | Prod Config |
|---------|---------|------------|-------------|
| **Supabase** | Database, Auth, Storage | Project: `rbvzilbifkdloeffabyb` | TBD |
| **OpenAI** | AI features (embeddings, summaries) | Not configured | TBD |
| **Vercel** | Hosting & deployment | Not connected | TBD |

### Supabase Configuration (Verified)

- **Project URL**: `https://rbvzilbifkdloeffabyb.supabase.co`
- **Database**: PostgreSQL with pgvector extension (for future semantic search)
- **Auth**: Email/password authentication enabled
- **Storage**: Bucket `vault-files` (private, needs creation)
- **RLS**: Enabled on all tables with user isolation policies

### Service Limits (Current)

- **Supabase Free Tier**: 500MB database, 1GB file storage, 50MB file upload limit
- **Storage Quota**: Application enforces 1GB per user
- **File Upload**: 50MB per file (enforced in upload component)

## Verified vs Unknown

### ✅ Verified
- Development environment variables exist in `.env.local`
- Supabase project is created and accessible
- Database schema defined in `supabase/schema.sql`
- Storage bucket structure defined
- RLS policies defined for all tables
- `.gitignore` excludes secret files
- Next.js config allows Supabase image domains

### ❓ UNKNOWN / NEEDS CONFIRMATION
- Staging environment existence and configuration
- Production environment existence and configuration
- Vercel project connection status (project.json exists but deployment unconfirmed)
- OpenAI API key availability and quota
- Supabase production project scaling requirements
- Custom domain configuration
- SSL/TLS certificate management
- Backup and disaster recovery for Supabase
- Monitoring and alerting setup
- Rate limiting configuration (Supabase Auth has built-in, API routes need verification)
- CORS configuration for production domains
- Two-factor authentication on Supabase/Vercel/GitHub accounts