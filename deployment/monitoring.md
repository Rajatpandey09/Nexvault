# Monitoring & Logging Implementation Plan

This document provides ready‑to‑apply steps to add comprehensive monitoring, logging, and health‑check capabilities to the Personal Knowledge Vault.  It covers the following subsystems:

1. **Application logs** – structured logging on the server and client
2. **Error tracking** – integration with Sentry
3. **Infrastructure health checks** – custom health‑endpoints and Vercel health checks
4. **Real‑time metrics & observability** – Logtail (Vercel Logs), Vercel Analytics, and optional Prometheus+Grafana
5. **Alerting** – Slack/Webhook notifications for critical events

Follow the steps in the order presented.  All code snippets rely on the existing project structure and will add only minimal overhead.

---

## 1. Structured Logging (Server & Client)

### 1.1 Install Pino & Hono (if using Node) or `pino-http`

The application uses Next.js API routes (none in current repo) and Supabase client on the client side.  We'll add structured logging that works in both environments.

```bash
# Install Pino for server‑side
npm i pino
```

> **Tip:** For serverless functions on Vercel, or for `src/lib/supabase.ts` which runs in Node, `pino` is efficient and aligns with Vercel's log format.

### 1.2 Create a logging helper

Add the following file: `src/lib/logger.ts`

```ts
// src/lib/logger.ts
import { createLogger, transports, format } from 'pino';

const isProd = process.env.NODE_ENV === 'production';

export const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: format.json(),
  transports: [
    new transports.Console({
      // Log only JSON (Vercel expects JSON lines)
      serialize: msg => JSON.stringify(msg),
    }),
  ],
});

// Convenience wrappers
export const log = logger;
export const error = logger.error;
export const warn = logger.warn;
export const debug = logger.debug;
```

> **Why JSON?** Vercel parses logs as JSON lines and displays structured data on the dashboard.

### 1.3 Instrument server‑side code

Update **supabase.ts** to log operations.  Add at the very beginning of each async function.

```ts
// src/lib/supabase.ts
import { log } from '@/lib/logger';

// Inside functions, e.g., fetching a file
const { data: files, error } = await supabase
  .from('files')
  .select('*')
  .eq('user_id', user?.id)
  .eq('is_deleted', false)
  .order('created_at', { ascending: false });

if (error) {
  error({ msg: 'Failed to fetch files', error });
}
```

### 1.4 Instrument client‑side code

Wrap `supabase` calls in your `src/lib/supabase.ts` with a helper that logs failures.

```ts
// src/lib/supabase.ts
import { error as logError } from '@/lib/logger';

export const safeSupabaseQuery = async (fn: () => Promise<any>) => {
  try {
    return await fn();
  } catch (e: any) {
    logError({ msg: 'Supabase query failed', error: e.message });
    throw e;
  }
};
```

> Use `safeSupabaseQuery(() => supabase.from(...))` in the UI.

---

## 2. Error Tracking with Sentry

### 2.1 Install Sentry SDK

```bash
npm i @sentry/nextjs @sentry/react
```

### 2.2 Configure Sentry

Create a `sentry.client.config.js` and `sentry.server.config.js` in the root (one level above `src`):

```js
// sentry.client.config.js
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

```js
// sentry.server.config.js
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

Add the following to your `package.json` scripts to automatically bundle Sentry:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "sentry:release": "sentry-cli releases new $npm_package_version"
}
```

> You'll need a Sentry account and project.  Set the DSN in your `.env.local`:
>```dotenv
>SENTRY_DSN=https://<key>@<sentry.io>/<project>
>```

### 2.3 Wrap API Calls

For any `getServerSideProps`, API routes, or data‑fetch functions, wrap calls with Sentry error capture.

```ts
// Example in getServerSideProps
export async function getServerSideProps(ctx) {
  try {
    const files = await safeSupabaseQuery(() => supabase.from(...));
    return { props: { files } };
  } catch (err) {
    Sentry.captureException(err);
    return { props: { files: [] } };
  }
}
```

---

## 3. Health‑Check Endpoint

Add a simple health‑check so Kubernetes/Vercel can poll the app.

Create `pages/api/health.ts`:

```ts
// pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

export default async function health(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Optional: small DB ping
    await import('../src/lib/supabase').then(m => m.supabaseAdmin());
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  } catch (e: any) {
    logger.error({ msg: 'Health check failed', error: e.message });
    res.status(500).json({ status: 'error', error: e.message });
  }
}
```

Vercel automatically exposes `/api/health`.  Add a `vercel.json` health check rule if needed:

```json
{
  "healthCheck": {
    "path": "/api/health",
    "interval": 300
  }
}
```

---

## 4. Real‑time Metrics & Observability

### 4.1 Use Vercel Logs (Logtail)

Vercel integrates with Logtail.  Once your project is deployed, enable Logtail from the dashboard.  Structured logs from `pino` will be displayed as JSON.

### 4.2 Optional: Prometheus & Grafana

If you wish to expose Prometheus metrics for deeper observability:

```ts
// pages/api/metrics.ts
import { Counter, register } from 'prom-client';
const requestCount = new Counter({ name: 'request_counter_total', help: 'Total requests' });

export default async function metrics(req, res) {
  requestCount.inc();
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
}
```

Then set the metrics endpoint in your Vercel `vercel.json`: 

```json
{
  "healthCheck": {
    "path": "/api/health",
    "interval": 300
  },
  "functions": {
    "api/**.ts": {"includeFiles": ["prom-client.ts"]}
  }
}
```

### 4.3 Vercel Analytics

Vercel offers built‑in analytics for traffic metrics.  Just enable it in the dashboard and it will start tracking page views, response times, and error rates.

---

## 5. Alerting (Slack/Webhook)

### 5.1 Send Slack webhook on critical logs

Add the following to `src/lib/logger.ts`: 

```ts
import fetch from 'node-fetch';

const slackWebhook = process.env.SLACK_WEBHOOK_URL;

export const critical = async (msg: any) => {
  logger.error(msg);
  if (slackWebhook) {
    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: JSON.stringify(msg) }),
    });
  }
};
```

Emergency logs (e.g., server crashes, auth failures) should use `critical({…})`.

---

## 6. Monitor & Debug Workflow

1. **Local** – run `npm run dev` and use the browser devtools to inspect the console and network.  In the terminal you’ll see JSON logs.  Use `debug({ … })` for verbose output.
2. **Staging/Prod** – deploy to Vercel, go to the *Logs* tab.  All structured logs appear as JSON lines; you can filter by `msg` or `level`.
3. **Sentry** – view crash reports, performance traces, and user sessions.
4. **Vercel Analytics** – see page error rates and response times.
5. **Slack** – receive real‑time alerts for critical events.

---

## 7. Quick Checklist for Implementation

- [ ] Install `pino` and create `src/lib/logger.ts`.
- [ ] Wrap all Supabase calls with error logging.
- [ ] Add `sentry` packages and DSN environment var.
- [ ] Configure `pages/api/health` endpoint.
- [ ] Enable Vercel Logtail.
- [ ] Configure optional Prometheus metrics.
- [ ] Hook critical logs to Slack via webhook.
- [ ] Verify logs are visible in Vercel dashboard.
- [ ] Test Sentry error capture by throwing a deliberate error.
- [ ] Add health‑check rule in `vercel.json` if needed.

---

### Summary

After following the steps above, your production deployment will:

1. Emit structured, searchable logs via Pino.
2. Capture exceptions in Sentry with user context.
3. Provide a `/api/health` endpoint for uptime monitoring.
4. Expose metrics (optional). 
5. Trigger Slack alerts on critical failures.
6. Leverage Vercel's built‑in log tailing and analytics for real‑time observability.

Feel free to tweak the logging levels or add more metrics as your application grows.  Let me know if you’d like sample code for custom metrics, error‑boundary components, or a more extensive alerting strategy.