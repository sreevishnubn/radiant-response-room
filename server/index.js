const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const outDir = path.join(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Supabase client (optional) - set SUPABASE_URL and SUPABASE_SERVICE_KEY in server env
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const useSupabase = SUPABASE_URL && SUPABASE_SERVICE_KEY;
let supabase = null;
if (useSupabase) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });
}

app.get('/', (req, res) => res.json({ msg: 'Agent server running' }));

// Simple in-memory queue for tasks (prototype)
const taskQueue = [];
let runningWorkers = 0;
const MAX_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '2', 10);

// Improved runner with configurable retries, timeouts, and structured logs
const DEFAULT_NAVIGATION_TIMEOUT = 30000; // ms
const DEFAULT_ACTION_TIMEOUT = 8000; // ms per action
const DEFAULT_RETRIES = 1;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function runTaskRecord(taskId, url, actions, opts = {}) {
  const navTimeout = opts.navigationTimeout || DEFAULT_NAVIGATION_TIMEOUT;
  const actionTimeout = opts.actionTimeout || DEFAULT_ACTION_TIMEOUT;
  const retries = typeof opts.retries === 'number' ? opts.retries : DEFAULT_RETRIES;

  const logs = [];

  for (let attempt = 0; attempt <= retries; attempt++) {
    const attemptStart = Date.now();
    logs.push({ type: 'info', message: `Starting attempt ${attempt + 1}/${retries + 1}`, ts: Date.now() });

    let browser;
    try {
      browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();

      page.on('console', msg => logs.push({ type: 'console', text: msg.text(), ts: Date.now() }));
      page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message, ts: Date.now() }));

      logs.push({ type: 'navigation', message: `goto ${url}`, ts: Date.now() });
      await page.goto(url, { waitUntil: 'load', timeout: navTimeout });

      if (Array.isArray(actions)) {
        for (let i = 0; i < actions.length; i++) {
          const a = actions[i];
          const stepStart = Date.now();
          try {
            logs.push({ type: 'action', index: i, action: a, message: `start ${a.type}`, ts: Date.now() });
            if (a.type === 'click' && a.selector) {
              await page.click(a.selector, { timeout: actionTimeout });
            } else if (a.type === 'fill' && a.selector) {
              await page.fill(a.selector, a.value || '', { timeout: actionTimeout });
            } else if (a.type === 'wait') {
              await page.waitForTimeout(a.ms || 1000);
            } else if (a.type === 'eval' && a.script) {
              const r = await page.evaluate(a.script);
              logs.push({ type: 'eval-result', index: i, result: r, ts: Date.now() });
            } else {
              logs.push({ type: 'warning', index: i, action: a, message: `unknown action type ${a.type}`, ts: Date.now() });
            }
            logs.push({ type: 'action-done', index: i, action: a, duration: Date.now() - stepStart, ts: Date.now() });
          } catch (err) {
            logs.push({ type: 'action-error', index: i, action: a, message: String(err), ts: Date.now() });
            // decide whether to fail this attempt or continue; for now, continue
          }
        }
      }

      const filename = `screenshot-${taskId}.png`;
      const screenshotPath = path.join(outDir, filename);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      await browser.close();

      let screenshotUrl = null;
      if (supabase) {
        try {
          const fileStream = fs.createReadStream(screenshotPath);
          const uploadRes = await supabase.storage.from('agent-screenshots').upload(filename, fileStream, { upsert: true });
          if (uploadRes.error) throw uploadRes.error;
          const { data } = supabase.storage.from('agent-screenshots').getPublicUrl(filename);
          screenshotUrl = data.publicUrl;

          await supabase.from('agent_tasks').update({ status: 'done', screenshot_path: filename, logs }).eq('id', taskId);
        } catch (e) {
          logs.push({ type: 'warning', message: 'Failed to upload screenshot or update task', error: e?.message || String(e), ts: Date.now() });
        }
      }

      logs.push({ type: 'info', message: `Completed in ${Date.now() - attemptStart}ms`, ts: Date.now() });
      return { ok: true, logs, screenshotPath, screenshotUrl };
    } catch (err) {
      logs.push({ type: 'error', message: String(err), ts: Date.now() });
      if (browser) {
        try { await browser.close(); } catch (e) {}
      }
      if (attempt < retries) {
        logs.push({ type: 'info', message: `Retrying in 1000ms (attempt ${attempt + 1})`, ts: Date.now() });
        await sleep(1000);
        continue; // next attempt
      }

      if (supabase) {
        try {
          await supabase.from('agent_tasks').update({ status: 'error', logs }).eq('id', taskId);
        } catch (e) {}
      }

      return { ok: false, error: String(err), logs };
    }
  } // end attempts
}

function processQueue() {
  if (runningWorkers >= MAX_CONCURRENCY) return;
  const job = taskQueue.shift();
  if (!job) return;
  runningWorkers++;
  (async () => {
    const { taskId, url, actions } = job;
    console.log('[worker] processing', taskId);
    const res = await runTaskRecord(taskId, url, actions);
    runningWorkers--;
    // If task recorded without supabase, we could emit events / logs here.
    // process next job
    setImmediate(processQueue);
  })().catch((e) => {
    console.error('Worker error', e);
    runningWorkers--;
    setImmediate(processQueue);
  });
}

// POST /run
// body: { url: string, actions?: Array<{type, selector, value, ms}>, async?: boolean }
app.post('/run', async (req, res) => {
  const { url, actions, async: doAsync } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });

  const taskId = uuidv4();
  const record = { id: taskId, url, actions: actions || [], status: doAsync ? 'pending' : 'running' };

  if (supabase) {
    try {
      await supabase.from('agent_tasks').insert([record]);
    } catch (e) {
      console.warn('Failed to insert task record', e?.message || e);
    }
  }

  if (doAsync) {
    taskQueue.push({ taskId, url, actions });
    setImmediate(processQueue);
    return res.json({ ok: true, taskId, queued: true });
  }

  // synchronous run (blocking)
  const result = await runTaskRecord(taskId, url, actions);
  if (result.ok) {
    const b64 = fs.readFileSync(result.screenshotPath).toString('base64');
    res.json({ ok: true, logs: result.logs, screenshot: `data:image/png;base64,${b64}`, screenshotUrl: result.screenshotUrl, taskId });
  } else {
    res.status(500).json({ error: result.error, logs: result.logs });
  }
});

// GET /tasks - list recent tasks (requires SUPABASE if configured, else falls back to empty)
app.get('/tasks', async (req, res) => {
  try {
    if (!supabase) return res.json({ ok: true, tasks: [] });
    const { data, error } = await supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, tasks: data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Presets: GET /presets, POST /presets
const PRESET_FILE = path.join(__dirname, 'presets.json');

app.get('/presets', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('agent_presets').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true, presets: data });
    }

    // fallback to local file
    const txt = fs.readFileSync(PRESET_FILE, 'utf-8');
    const presets = JSON.parse(txt);
    res.json({ ok: true, presets });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/presets', async (req, res) => {
  try {
    const { name, description, actions } = req.body || {};
    if (!name || !actions) return res.status(400).json({ error: 'name and actions are required' });

    if (supabase) {
      const { data, error } = await supabase.from('agent_presets').insert([{ name, description: description || null, actions }]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true, preset: data });
    }

    const txt = fs.readFileSync(PRESET_FILE, 'utf-8');
    const presets = JSON.parse(txt);
    const id = `preset-${Date.now()}`;
    const p = { id, name, description: description || null, actions };
    presets.unshift(p);
    fs.writeFileSync(PRESET_FILE, JSON.stringify(presets, null, 2));
    res.json({ ok: true, preset: p });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /tasks/:id - fetch task info
app.get('/tasks/:id', async (req, res) => {
  if (!supabase) return res.status(400).json({ error: 'Supabase not configured' });
  try {
    const id = req.params.id;
    const { data, error } = await supabase.from('agent_tasks').select('*').eq('id', id).limit(1).single();
    if (error) return res.status(404).json({ error: error.message });
    let publicUrl = null;
    if (data.screenshot_path) {
      const { data: p } = supabase.storage.from('agent-screenshots').getPublicUrl(data.screenshot_path);
      publicUrl = p.publicUrl;
    }
    res.json({ ok: true, task: { ...data, screenshotUrl: publicUrl } });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`[agent server] listening on ${port}`));
