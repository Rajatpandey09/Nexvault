 NEXVAULT – Personal Knowledge Management Platform

  ▎ NexVault is a secure, multilingual, AI‑enhanced personal knowledge‑base built with Next.js 14, TypeScript, Tailwind CSS, Supabase, and Zustand.
  ▎ It lets you capture, organize, search, and rediscover notes, documents, images, links, and other digital assets in a clean, responsive UI that works on desktop and mobile devices.

  ---

  Table of Contents

  1. Features (#features)
  2. Tech Stack (#tech-stack)
  3. Project Structure (#project-structure)
  4. Screenshots / UI Mock‑ups (#screenshots--ui-mock-ups)
  5. Getting Started (#getting-started)
     - Prerequisites (#prerequisites)
     - Installation (#installation)
     - Environment Variables (#environment-variables)

  6. Authentication (#authentication)
     6.1 Protected Routes & Middleware (#protected-routes--middleware)
     6.2 Session Persistence & Zustand Store (#session-persistence--zustand-store)
     6.2 Security Overview
     6.3 2‑FA / Recovery Flow (planned)
  7. Core Functionality (#core-functionality)
     - File Upload (Drag‑&‑Drop) (#file-upload--drag--drop)
     - Supported File Types & Extraction (#supported-file-types--extraction)
     - [Duplicate Detection (SHA‑256)**
     - Backend Storage (Supabase) (#backend-storage--supabase)
     - Documents Dashboard (#documents-dashboard)
     - Images Dashboard (#images-dashboard)
     - Notes Dashboard (#notes-dashboard)
     - Links Dashboard (#links-dashboard)
     - Tags & Tag Groups (#tags--tag-group)
     - Favorites & Trash Management (#favorites--trash-management)
     - Search & Filters (#search--filters)
     - Recent Items & Activity Log (#recent-items--activity-log)
     - Search Indexing & Full‑Text Extraction (#search-indexing--full‑text-extraction)
     - AI‑Powered Features (Roadmap) (#ai‑powered-features--roadmap)
     - Voice Search (Web Speech API) (#voice-search--web-speech-api)
     - [Scripting API (JavaScript)**
     - Shell / Poetry Scripts (#shell--poetry-scripts)

  8. Development Workflow (#development-workflow)
  9. Deployment (#deployment)
     9.1 Docker‑Ready (Optional) (#docker-ready--optional)
     9.2 Vercel Deployment (#vercel-deployment)
     9.3 Environment Variables for Production
  10. Security & Privacy (#security--privacy)

  - Row‑Level Security (RLS) Policies
  - Service‑Role Protection
  - File Encryption & Access Controls

  11. Extensibility & Future Roadmap (#extensibility--future-roadmap)
  12. Contributing (#contributing)
  13. License (#license)
  14. Acknowledgements & Thanks (#acknowledgements--thanks)

  ---

  Features

  - Secure Storage – All user data lives in a private Supabase bucket with Row‑Level Security policies.
  - Multi‑Language UI – English and Hindi toggle in the header.
  - Dark / Light / System Theme – Persists per user using Zustand.
  - Drag‑&‑Drop File Upload – Supports 500 MB per file, up to 1 GB total quota.
  - File Type Validation – PDF, Office docs, text, images, code, archives, audio/video, archives, etc.
  - Duplicate Detection – SHA‑256 hash checks before upload; prevents redundant storage.
  - Search Engine – Full‑text keyword search across titles, content, extracted text (LIKE‑based) plus planned semantic search via embeddings.
  - Filter By Type – Separate views for Files, Notes, Links.
  - File Preview & Download – Inline previews (PDF, images, text) and direct file download via signed URLs.
  - Organizational Tools
    - Tags & Tag Groups (badge UI)
    - Favorites (star) for quick access
    - “Trash” with soft‑delete, restore, and permanent purge actions

  - Recent Items List – Auto‑generated feed of the most‑recently accessed files, notes, or links.
  - Voice Search – Built‑in voice‑to‑text via Web Speech API; results instantly routed to the search endpoint.
  - Voice‑Controlled Commands (planned) – e.g., “Show all notes about finance”.
  - Responsive UI – Grid & list layouts adapt to any screen size; safe‑area insets for iOS notch devices.
  - Accessibility – Keyboard navigation, ARIA labels, focus‑visible rings, reduced‑motion defaults.
  - Developer Experience
    - TypeScript strict mode
    - Pre‑commit linting (ESLint/Prettier) (planned CI)
    - Dockerfile (optional) for local dev environment
    - Comprehensive unit & integration test scaffold (Jest) (planned)

  ---

  Tech Stack

  ┌────────────────────┬────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────┐
  │       Layer        │                 Technology                 │                                    Why                                     │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ Frontend           │ Next.js 14 (App Router)                    │ File‑based routing, server‑components, built‑in API routes                 │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │                    │ TypeScript                                 │ End‑to‑end type safety                                                     │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │                    │ Tailwind CSS                               │ Utility‑first styling, theme‑aware dark mode, design‑system consistency    │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │                    │ React Query / SWR (planned)                │ Optimistic data fetching for future sync features                          │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ State Management   │ Zustand                                    │ Small, performant global store (auth, UI state)                            │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ Auth & Backend     │ Supabase (PostgreSQL + Auth + Storage)     │ Managed PostgreSQL, built‑in RLS, email‑password auth, private file bucket │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ File Processing    │ pdf‑parse, mammoth, sharp (image resizing) │ Extract text from PDFs/Docs; generate thumbnails                           │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │                    │ Tesseract.js (OCR – optional)              │ Extract text from images (future OCR integration)                          │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │                    │ CryptoJS / SHA‑256 (helpers)               │ Duplicate detection, hash verification                                     │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ Data Visualization │ Recharts (planned)                         │ Graphs of usage stats                                                      │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ Testing            │ Jest, React Testing Library (planned)      │ Unit & integration coverage                                                │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ Deployment         │ Vercel (recommended)                       │ Auto‑scaling, edge‑caching, preview deployments                            │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ CI/CD              │ GitHub Actions (planned)                   │ Lint → Test → Build → Deploy pipeline                                      │
  ├────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ Packaging          │ Poetry (project metadata)                  │ Manage dependencies, scripts for dev & prod                                │
  └────────────────────┴────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────┘

  ---

  Project Structure

  src/
  ├─ app/
  │   ├─ dashboard/
  │   │   ├─ layout.tsx
  │   │   ├─ page.tsx
  │   │   ├─ upload/
  │   │   │   └─ page.tsx
  │   │   ├─ files/
  │   │   │   └─ page.tsx
  │   │   ├─ notes/
  │   │   │   └─ page.tsx
  │   │   ├─ links/
  │   │   │   └─ page.tsx
  │   │   ├─ recent/
  │   │   │   └─ page.tsx
  │   │   └─ trash/
  │   │       └─ page.tsx
  │   ├─ auth/
  │   │   ├─ login/
  │   │   │   └─ page.tsx
  │   │   ├─ signup/
  │   │   │   └─ page.tsx
  │   │   └─ callback/
  │   │       └─ page.tsx
  │   ├─ settings/
  │   │   └─ page.tsx
  │   └─ layout.tsx
  ├─ components/
  │   ├─ layout/
  │   │   ├─ Header.tsx
  │   │   └─ Sidebar.tsx
  │   ├─ ui/
  │   │   ├─ Button.tsx
  │   │   ├─ Card.tsx
  │   │   ├─ Toast.tsx
  │   │   └─ ... (other UI primitives)
  │   └─ features/
  │       ├─ upload/
  │       │   └─ Upload.tsx
  │       ├─ notes/
  │       │   └─ NoteEditor.tsx
  │       ├─ links/
  │       │   └─ LinkForm.tsx
  │       └─ ... (other feature‑specific components)
  ├─ lib/
  │   ├─ supabase.ts            # Supabase client wrapper
  │   └─ i18n.ts                # i18n context & helpers
  ├─ store/
  │   └─ appStore.ts            # Zustand store (user, ui state)
  ├─ utils/
  │   ├─ helpers.ts             # file‑hash, size formatting, validation
  │   └─ analytics.ts            # optional analytics hooks
  ├─ types/
  │   └─ index.ts               # shared TypeScript interfaces
  ├─ public/
  │   └─ ... (static assets)
  ├─ scripts/
  │   └─ deploy.sh               # optional deployment helper
  └─ ... (config files)

  ---

  Getting Started

  Prerequisites

  ┌──────────────────┬───────────────────────────────────────┐
  │   Requirement    │            Minimum Version            │
  ├──────────────────┼───────────────────────────────────────┤
  │ Node.js          │ 18.x (LTS)                            │
  ├──────────────────┼───────────────────────────────────────┤
  │ npm / yarn       │ 9.x                                   │
  ├──────────────────┼───────────────────────────────────────┤
  │ Git              │ 2.30+                                 │
  ├──────────────────┼───────────────────────────────────────┤
  │ Supabase Account │ Free tier sufficient for development  │
  ├──────────────────┼───────────────────────────────────────┤
  │ Operating System │ Windows 10/11, macOS 12+, Linux (any) │
  └──────────────────┴───────────────────────────────────────┘

  Installation

  # 1️⃣  Clone the repo
  git clone https://github.com/<rajat945pp>/personal-knowledge-vault.git
  cd personal-knowledge-vault

  # 2️⃣  Install dependencies
  npm install          # or `yarn install`

  # 3️⃣  Copy the env template
  cp .env.example .env
  # Edit .env with your Supabase credentials and optional quota limits

  Environment Variables

  Create a .env file at the project root with the following keys (values from your Supabase project):

  dotenv
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

  # Service role (used only by server‑side scripts, DO NOT expose to client)
  SUPABASE_SERVICE_ROLE_KEY=service_role_XXXXXXXXXXXXXXXXXXXX

  # Misc
  NEXT_PUBLIC_MAX_FILE_SIZE=524288000      # 500 MB per file (bytes)
  MAX_STORAGE_QUOTA=1073741824            # 1 GB total quota (bytes)

  # Optional – local dev overrides
  NEXT_PUBLIC_MAX_UPLOAD_SIZE=524288000    # same as above but for dev

  ▎ Never commit .env – it is listed in .gitignore.

  Run the Development Server

  npm run dev   # or `yarn dev`
  # Open http://localhost:3000

  The app will hot‑reload on code changes.

  ---

  Authentication

  - Login – /auth/login
  - Sign‑Up – /auth/signup
  - OAuth Callback – /auth/callback handles the Supabase OAuth redirect.

  All authentication flows store the session in the Zustand store (useAppStore) and automatically redirect unauthenticated users to the login page.

  Protected Routes & Middleware

  - Path /dashboard/* and all /dashboard/* sub‑pages are guarded by middleware (src/app/layout.tsx).
  - If no session exists, the user is redirected to /auth/login.

  // src/app/layout.tsx (excerpt)
  if (!session) {
    router.replace('/auth/login');
  }

  ---

  Core Functionality

  File Upload & Drag‑&‑Drop

  - UI – src/app/dashboard/upload/page.tsx
  - Features
    - Drag‑&‑drop zone + click‑to‑select fallback.
    - Real‑time progress bar, upload speed indicator.
    - Maximum per‑file size: 500 MB.
    - Maximum total storage: 1 GB (enforced server‑side).
    - Duplicate detection prevents re‑uploading identical files (SHA‑256 hash comparison).

  // In UploadPage.tsx
  if (duplicateHash) {
    showToast('File already exists in your vault.');
  }

  Supported File Types & Extraction

  ┌─────────────┬────────────────────────────────┬──────────────────────────────────┐
  │  Category   │           Extensions           │        Extraction Method         │
  ├─────────────┼────────────────────────────────┼──────────────────────────────────┤
  │ Documents   │ .pdf, .docx, .doc, .txt, .md   │ pdf-parse, mammoth               │
  ├─────────────┼────────────────────────────────┼──────────────────────────────────┤
  │ Images      │ .png, .jpg, .jpeg, .webp, .svg │ Direct display / EXIF extraction │
  ├─────────────┼────────────────────────────────┼──────────────────────────────────┤
  │ Audio/Video │ .mp3, .wav, .mp4               │ Metadata extraction              │
  ├─────────────┼────────────────────────────────┼──────────────────────────────────┤
  │ Code / Data │ .json, .csv, .yaml             │ Parsed as plain text for search  │
  └─────────────┴────────────────────────────────┴──────────────────────────────────┘

  Backend Storage (Supabase)

  - Bucket: vault-files (private).
  - Files are stored as {user_id}/{hash}.{ext}.
  - Access is served via signed URLs that expire after 5 minutes.

  Documents Dashboard

  - Route: /dashboard/documents (src/app/dashboard/documents/page.tsx)
  - Features:
    - Full‑text search across extracted document text.
    - Tag filtering.
    - Favorite toggle.
    - Download / preview.

  Images Dashboard

  - Route: /dashboard/images (src/app/dashboard/images/page.tsx)
  - Grid of thumbnails; click to open preview modal.

  Notes Dashboard

  - Route: /dashboard/notes/page.tsx
  - WYSIWYG editor with markdown support, tag picker, and quick‑save.

  Links Dashboard

  - Route: /dashboard/links/page.tsx
  - Auto‑fetches Open‑Graph metadata for URL preview.

  Tags & Tag Group

  - Tags are stored as separate rows linked to the user.
  - UI shows chips; you can create, edit, delete, or merge tags.

  Favorites & Trash Management

  - Favorites: A is_favorite boolean column on each item (files, notes, links).
  - Trash:
    - Soft‑delete (is_deleted = true) keeps the file in storage for 30 days.
    - Restore – toggles is_favorite back and flips is_deleted.
    - Permanent Delete – removes DB row and deletes the storage object.

  Search & Filters

  - Search Input (global) triggers async call to /api/search (or direct Supabase query).
  - Returns SearchResult[] with type, title, snippet, match_field.
  - UI shows tags, creation date, and a “matched in” label.

  Search Indexing & Full‑Text Extraction

  - On upload, extracted text is stored in files.extracted_text.
  - Search queries run against files.extracted_text and files.original_filename.
  - Future: Replace with vector embeddings for semantic search (planned).

  Recent Items

  - Retrieves the most‑recently accessed items across file types, sorts by accessed_at, limits to 10.
  - Displays icon, trunc‑truncated title, tags, and timestamp.

  ---

  AI‑Powered Features (Roadmap)

  ┌─────────────────────────┬───────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │         Feature         │            Status             │                                                    Implementation Plan                                                     │
  ├─────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Semantic Search         │ Planned                       │ Generate embeddings for each document (using OpenAI text-embedding‑ada‑002 or open‑source sentence‑transformers). Store    │
  │                         │                               │ vectors in Supabase vector column; perform nearest‑neighbor search (vector_cosine_distance).                               │
  ├─────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ AI Summaries            │ Planned                       │ Use OpenAI ChatCompletion on extracted document text; store summary in metadata.summary.                                   │
  ├─────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Tag Suggestions         │ Planned                       │ Compare document content to existing tag taxonomies; suggest relevant tags.                                                │
  ├─────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Ask My Vault            │ Planned                       │ Natural‑language UI that queries the embedding index and returns concise answers.                                          │
  ├─────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Similar‑Content         │ Planned                       │ Compute cosine similarity against all vectors; surface top‑5 similar items.                                                │
  │ Recommendations         │                               │                                                                                                                            │
  ├─────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ OCR Integration         │ Partially implemented         │ Wire up OCR on image uploads; store extracted text for search.                                                             │
  │                         │ (Tesseract.js present)        │                                                                                                                            │
  ├─────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Voice‑Activated         │ Planned                       │ Expand Web Speech API usage to parse free‑form commands.                                                                   │
  │ Commands                │                               │                                                                                                                            │
  └─────────────────────────┴───────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ---

  Security & Privacy

  Row‑Level Security (RLS)

  All tables have RLS policies that compare user_id with auth.uid(). Example (SQL) for the files table:

  CREATE POLICY "User can view own files"
    ON files FOR SELECT USING (user_id = auth.uid());

  CREATE POLICY "User can insert own files"
    ON files FOR INSERT WITH CHECK (user_id = auth.uid());

  -- analogous policies for notes, links, tags, etc.

  These policies enforce that no user can read or modify another user’s data, even via direct SQL calls.

  API Key / Service‑Role Protection

  - The service‑role key is only used by server‑side scripts (e.g., background jobs, admin tools).
  - It is never exposed in client‑side code or environment variables shipped to the browser.

  Data Encryption & Access Controls

  - Files are stored encrypted at rest by Supabase (S3‑compatible encryption).
  - Access to files is mediated through signed URLs that are short‑lived (5 min).
  - All communications are forced over HTTPS.

  ---

  Extensibility & Future Roadmap

  ┌─────────────────────┬────────────────────────────────────────────────────────────────────────┐
  │        Area         │                          Planned Enhancements                          │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Migrations          │ Add Drizzle ORM migrations for versioned schema changes.               │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ CI/CD               │ GitHub Actions pipeline: lint → test → build → deploy to Vercel.       │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Docker              │ Provide a Dockerfile for local dev with Supabase mock containers.      │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Testing             │ Expand Jest unit tests; add Cypress e2e tests for upload flows.        │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Analytics           │ Integrate Plausible or Umami for anonymous usage metrics.              │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Multi‑Vault Support │ Allow a single account to own multiple isolated vaults (via vault_id). │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Public Sharing      │ Controlled sharing links with per‑item permission bits.                │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Advanced Themes     │ Add system‑wide custom color palettes via CSS variables.               │
  └─────────────────────┴────────────────────────────────────────────────────────────────────────┘

  ---

  Contributing

  1. Fork the repository.
  2. Create a feature branch: git checkout -b feature/your‑name.
  3. Write code, add tests, and ensure linting passes (npm run lint).
  4. Commit with clear messages (feat: add voice‑search).
  5. Open a Pull Request – the CI pipeline will run lint, test, and build checks.

  Please consult the (planned) CONTRIBUTING.md for coding standards, code‑review guidelines, and release process.

  ---

  License

  MIT License

  Copyright (c) 2024 <RAJAT/KAILASH>

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without restriction on
  dealing in the Software without restriction, including without restriction
  on the rights to use, copy, modify, merge, publish, distribute, sublicense,
  and/or sell copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following conditions:

  ... (standard MIT boilerplate) ...

  ---

  Acknowledgements & Thanks

  - Supabase – for the generous hosted Postgres, Auth, and Storage services.
  - Next.js – for the powerful App Router and server‑component model.
  - Tailwind CSS – for the utility‑first styling system.
  - Zustand – for simple, performant global state management.
  - Lucide Icons, Framer Motion, react‑dropzone, pdf‑parse, mammoth, and many other open‑source contributors.

  ---

  Prepared with love by the NexVault development team.
