# Build Process

This document describes the build system, dependencies, and build commands for the Personal Knowledge Vault.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Required for Next.js 14 |
| npm | 9+ | Comes with Node.js |
| Git | Any | For version control |

## Dependency Installation

```bash
# Install all dependencies (production + development)
npm install

# Or with clean install (recommended for CI)
npm ci
```

### Dependencies (from package.json)

**Production Dependencies:**
- `next@^14.2.5` - React framework with App Router
- `react@^18.3.1` & `react-dom@^18.3.1` - React library
- `@supabase/supabase-js@^2.45.0` - Supabase client
- `@supabase/auth-helpers-nextjs@^0.10.0` - Next.js auth helpers
- `zustand@^4.5.4` - State management
- `tailwindcss@^3.4.6` - CSS framework
- `framer-motion@^11.3.19` - Animations
- `lucide-react@^0.417.0` - Icons
- `date-fns@^3.6.0` - Date formatting
- `clsx@^2.1.1` & `tailwind-merge@^2.4.0` - Class name utilities
- `crypto-js@^4.2.0` - File hashing (SHA256)
- `mammoth@^1.7.2` - DOCX parsing
- `pdf-parse@^1.1.1` - PDF text extraction
- `react-dropzone@^14.2.3` - File upload
- `react-markdown@^9.0.1` - Markdown rendering
- `react-syntax-highlighter@^15.5.0` - Code highlighting
- `tesseract.js@^5.1.0` - OCR (planned)
- `openai@^4.52.0` - OpenAI API (planned)

**Development Dependencies:**
- `typescript@5.9.3` - Type checking
- `eslint@^8.57.0` & `eslint-config-next@^14.2.5` - Linting
- `autoprefixer@^10.4.19` - CSS prefixing
- `postcss@^8.4.40` - PostCSS processing
- `@types/*` - TypeScript definitions

## Build Commands

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Start production server (after build)
npm start

# Lint code
npm run lint

# Type check (if configured in package.json scripts)
npx tsc --noEmit
```

## Build Process Details

### Next.js Build (`npm run build`)

The build process performs:

1. **TypeScript Compilation** - Type checks all `.ts`/`.tsx` files
2. **Next.js Compilation** - Compiles App Router pages, components, API routes
3. **Tailwind CSS Processing** - Scans source files for class names, generates CSS
4. **Asset Optimization** - Images, fonts, static assets
5. **Code Splitting** - Automatic route-based code splitting
6. **Minification** - Production minification via SWC

### Build Output

```
.next/
├── static/           # Static assets (JS, CSS, images)
├── server/           # Server-side code (Node.js)
├── cache/            # Build cache (webpack, SWC)
├── required-server-files.json
└── build-manifest.json
```

### Platform-Specific Notes

- **Windows**: Uses `cmd.exe` or PowerShell; paths use backslashes
- **Linux/macOS**: Uses bash; paths use forward slashes
- **Vercel**: Automatic build detection for Next.js; no custom build command needed

## Required Environment for Build

The following environment variables must be set **at build time**:

| Variable | Required at Build? | Notes |
|----------|-------------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Used in client bundle |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Used in client bundle |
| `NEXT_PUBLIC_APP_URL` | Yes | Used in client bundle |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | Yes | Used in client bundle |
| `NEXT_PUBLIC_STORAGE_QUOTA` | Yes | Used in client bundle |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-only, not in client bundle |
| `NEXTAUTH_SECRET` | No | Server-only |
| `OPENAI_API_KEY` | No | Server-only |

### Build-Time vs Runtime Variables

- **Build-time**: Variables prefixed with `NEXT_PUBLIC_` are embedded in the client bundle
- **Runtime-only**: Server-side variables (`SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`) are NOT in the client bundle

## Verified Build Process

### ✅ Verified Working
- `npm install` completes successfully
- `npm run dev` starts development server on port 3001
- `npm run build` produces production build (tested locally)
- `npm run lint` passes with no errors
- TypeScript compilation passes (`npx tsc --noEmit`)
- Tailwind CSS compiles with custom config (vault colors, animations)

### ⚠️ Known Build Warnings
- PostCSS warning about `bg-white/3` class (fixed: changed to `bg-white/[0.03]`)
- No ESLint configuration file found (uses `eslint-config-next` defaults)

### ❓ UNKNOWN / NEEDS CONFIRMATION
- Build performance metrics (time, memory usage)
- Bundle size analysis
- Whether `output: 'standalone'` is needed for container deployment
- Cache behavior in CI/CD environments
- Whether SWC minification causes any issues with specific dependencies

## Build Artifacts for Deployment

For Vercel deployment, the following are automatically handled:
- `.next/` directory (build output)
- `public/` directory (static assets)
- `package.json` (dependencies)

For Docker/container deployment, you would need:
- `.next/standalone/` (if `output: 'standalone'` in next.config.js)
- `.next/static/`
- `public/`
- `node_modules/` (production only)

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.js` | Next.js configuration (images, experimental features) |
| `tailwind.config.js` | Tailwind CSS theme, colors, animations |
| `postcss.config.js` | PostCSS plugins (Tailwind, Autoprefixer) |
| `.env.local` | Local environment variables (not in git) |
| `.env.example` | Template for environment variables |

## TypeScript Configuration (tsconfig.json)

Key settings:
- `target: "ES2017"`
- `lib: ["dom", "dom.iterable", "esnext"]`
- `module: "esnext"`
- `moduleResolution: "bundler"`
- `jsx: "preserve"`
- `strict: true`
- `paths: { "@/*": ["./src/*"] }` - Path aliases for imports
- `plugins: [{ name: "next" }]` - Next.js TypeScript plugin

## Tailwind CSS Configuration

Custom theme includes:
- **Colors**: `vault.bg.*`, `vault.glass.*`, `vault.border.*`, `vault.accent.*`
- **Backdrop Blur**: `xs` through `xl`
- **Box Shadows**: `glass-sm`, `glass`, `glass-lg`, `glow-blue`, `glow-purple`
- **Animations**: `fade-in`, `slide-up`, `slide-down`, `slide-in-right`, `scale-in`, `pulse-subtle`, `shimmer`, `glow`
- **Border Radius**: `xl`, `2xl`, `3xl`
- **Dark Mode**: `class` strategy (manual toggle)

## Verified Build Output

Running `npm run build` produces:
- ✅ Compiled Next.js application in `.next/`
- ✅ Static assets in `.next/static/`
- ✅ Server code in `.next/server/`
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Tailwind CSS generated with custom theme

## Build Performance (Approximate)

| Step | Time (estimated) |
|------|-----------------|
| `npm install` | 30-60 seconds |
| `npm run build` | 60-120 seconds |
| `npm run lint` | 10-20 seconds |

*Note: Actual times depend on machine specs and cache state.*