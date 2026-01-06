import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ActionEditor from "@/components/ActionEditor";

const Agent = () => {
  const [serverUrl, setServerUrl] = useState("http://localhost:8787");
  const [url, setUrl] = useState("https://example.com");
  const [actions, setActions] = useState<string>("[]");
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // visual editor actions
  const [editorActions, setEditorActions] = useState<any[] | null>(null);
  const [presets, setPresets] = useState<any[]>([]);

  async function fetchHistory() {
    try {
      const res = await fetch(`${serverUrl}/tasks`);
      const data = await res.json();
      if (data.ok) setHistory(data.tasks || []);
    } catch (e) {
      // ignore
    }
  }

  async function fetchPresets() {
    try {
      const res = await fetch(`${serverUrl}/presets`);
      const data = await res.json();
      if (data.ok) setPresets(data.presets || []);
    } catch (e) {
      // ignore
    }
  }

  async function fetchTask(id: string) {
    try {
      const res = await fetch(serverUrl + '/tasks/' + id);
      const data = await res.json();
      if (data.ok) return data.task;
    } catch (e) {
      // ignore
    }
    return null;
  }

  useEffect(() => {
    fetchPresets();
    fetchHistory();
  }, [serverUrl]);

  async function savePreset(name: string, description: string, actions: any[]) {
    try {
      const res = await fetch(`${serverUrl}/presets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, actions })
      });
      const data = await res.json();
      if (data.ok) {
        await fetchPresets();
        alert('Preset saved');
        return;
      }
      alert(data.error || 'Failed to save preset');
    } catch (e) {
      alert(String(e));
    }
  }

  async function run() {
    setLoading(true);
    setScreenshot(null);
    setScreenshotUrl(null);
    setLogs([]);

    try {
      // prefer editor actions if available
      const parsedActions = editorActions !== null ? editorActions : (actions ? JSON.parse(actions) : undefined);
      const res = await fetch(`${serverUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, actions: parsedActions }),
      });
      const data = await res.json();
      if (data.ok) {
        setScreenshot(data.screenshot);
        setScreenshotUrl(data.screenshotUrl || null);
        setLogs(data.logs || []);
        // refresh history
        await fetchHistory();
      } else {
        alert(data.error || "Unknown error");
      }
    } catch (err) {
      alert(String(err));
    }

    setLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h2 className="mb-4 text-2xl font-semibold">Agent — Run a task</h2>

      <div className="space-y-3">
        <label className="block text-sm font-medium">URL</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <label className="block text-sm font-medium">Actions (JSON array)</label>
        <textarea
          className="w-full min-h-[120px] rounded border p-3 font-mono text-sm"
          value={actions}
          onChange={(e) => setActions(e.target.value)}
        />

        <div className="flex gap-2">
          <Button onClick={run} disabled={loading}>
            {loading ? "Running…" : "Run"}
          </Button>
          <Button onClick={fetchHistory} variant="outline">
            Refresh History
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <h3 className="mt-4 mb-2 font-medium">Actions</h3>
            <ActionEditor value={editorActions || []} onChange={(a)=>setEditorActions(a)} onSavePreset={savePreset} presets={presets} />

            {screenshot && (
              <div>
                <h3 className="mt-4 mb-2 font-medium">Screenshot</h3>
                <img src={screenshot} alt="screenshot" className="w-full rounded border" />
                {screenshotUrl && (
                  <div className="mt-2 text-sm">
                    Public URL: <a className="text-blue-600" href={screenshotUrl} target="_blank" rel="noreferrer">View</a>
                  </div>
                )}
              </div>
            )}

            {logs.length > 0 && (
              <div>
                <h3 className="mt-4 mb-2 font-medium">Logs</h3>
                <div className="max-h-64 overflow-auto rounded border p-3 text-sm space-y-1">
                  {logs.map((l, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-24 text-xs text-muted-foreground">{new Date(l.ts || Date.now()).toLocaleTimeString()}</div>
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">{l.type}</span>
                        <span className="ml-2">{l.message || (l.action ? JSON.stringify(l.action) : '')}</span>
                        {l.result && <pre className="mt-1 text-xs bg-muted p-2 rounded">{JSON.stringify(l.result)}</pre>}
                        {l.error && <div className="text-red-600 text-sm">{l.error}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="mt-4 mb-2 font-medium">History</h3>
            <div className="space-y-2 max-h-96 overflow-auto rounded border p-2">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">No history yet</div>
              ) : (
                history.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 border-b py-2">
                    <div>
                      <div className="text-sm font-medium">{t.url}</div>
                      <div className="text-xs text-muted-foreground">{t.status} — {new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={async () => {
                        const task = await fetchTask(t.id);
                        if (task) {
                          setLogs(task.logs || []);
                          if (task.screenshot_path) {
                            const publicUrl = task.screenshot_path.startsWith('http') ? task.screenshot_path : `${serverUrl}/uploads/${task.screenshot_path}`;
                            setScreenshotUrl(publicUrl);
                            // If Supabase public URL is provided in /tasks/:id response we prefer that (server already returns screenshotUrl)
                            if (task.screenshotUrl) setScreenshotUrl(task.screenshotUrl);
                          } else {
                            setScreenshotUrl(null);
                          }
                        }
                      }}>View</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Tip: Try actions like{' '}
          <code className="font-mono bg-muted px-1 rounded">{`[{"type":"click","selector":"a"}]`}</code>{' '}
          or leave the actions as <code className="font-mono">[]</code> to just take a screenshot.
        </p>
      </div>
    </div>
  );
};

export default Agent;
