# Agent server (Playwright prototype)

Quick prototype that runs Playwright tasks on the server.

Endpoints
- GET / → health check
- POST /run → run a task
  - body: { url: string, actions?: [ { type: 'click'|'fill'|'wait', selector?: string, value?: string, ms?: number } ] }
  - response: { ok: true, logs: [...], screenshot: 'data:image/png;base64,...' }

Run
1. cd server
2. npm install
3. Create `.env` from `.env.example` with your Supabase values (optional but required for persistence)
4. npm start

Notes
- Playwright will download required browser binaries on install.
- For persistence, create a Supabase storage bucket named `agent-screenshots` and run the migration in `supabase/migrations` (or run the SQL manually) to create `agent_tasks`.
- This is an MVP prototype. Add queuing, auth, and sandboxing before production.
- Ensure you keep `SUPABASE_SERVICE_KEY` secret (use service role key).
