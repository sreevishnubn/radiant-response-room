import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export type Action =
  | { type: "click"; selector: string }
  | { type: "fill"; selector: string; value: string }
  | { type: "wait"; ms: number }
  | { type: "eval"; script: string };

interface Props {
  value: Action[];
  onChange: (a: Action[]) => void;
  onSavePreset?: (name: string, description: string, actions: Action[]) => Promise<void>;
  presets?: any[];
}

const BUILTIN_PRESETS = [
  { id: "builtin-screenshot", name: "Full page screenshot", description: "Take full page screenshot" },
  { id: "builtin-click-first-link", name: "Click first link", description: "Click the first <a> on page" },
];

export const ActionEditor: React.FC<Props> = ({ value, onChange, onSavePreset, presets = [] }) => {
  const [actions, setActions] = useState<Action[]>(value || []);
  const [newType, setNewType] = useState<string>("click");
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [presetName, setPresetName] = useState("");
  const [presetDesc, setPresetDesc] = useState("");

  function pushAction(a: Action) {
    const next = [...actions, a];
    setActions(next);
    onChange(next);
  }

  function updateAction(idx: number, a: Action) {
    const next = actions.slice();
    next[idx] = a;
    setActions(next);
    onChange(next);
  }

  function removeAction(idx: number) {
    const next = actions.slice();
    next.splice(idx, 1);
    setActions(next);
    onChange(next);
  }

  function move(idx: number, delta: number) {
    const next = actions.slice();
    const item = next.splice(idx, 1)[0];
    next.splice(idx + delta, 0, item);
    setActions(next);
    onChange(next);
  }

  function loadPreset(preset: any) {
    const a = preset.actions || preset;
    setActions(a);
    onChange(a);
  }

  async function savePreset() {
    if (!onSavePreset) return;
    await onSavePreset(presetName || `Preset ${Date.now()}`, presetDesc, actions);
    setPresetName("");
    setPresetDesc("");
  }

  return (
    <div className="border rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <select value={newType} onChange={(e) => setNewType(e.target.value)} className="rounded border px-2 py-1">
          <option value="click">click</option>
          <option value="fill">fill</option>
          <option value="wait">wait</option>
          <option value="eval">eval</option>
        </select>
        <Button onClick={() => {
          if (newType === 'click') pushAction({ type: 'click', selector: 'a' });
          else if (newType === 'fill') pushAction({ type: 'fill', selector: 'input', value: '' });
          else if (newType === 'wait') pushAction({ type: 'wait', ms: 1000 });
          else if (newType === 'eval') pushAction({ type: 'eval', script: 'return document.title;' });
        }}>Add step</Button>

        <div className="ml-auto">
          <select onChange={(e) => {
            const id = e.target.value;
            if (!id) return;
            const preset = (presets || []).concat(BUILTIN_PRESETS).find((p:any)=>p.id===id);
            if (preset) loadPreset(preset);
          }} className="rounded border px-2 py-1">
            <option value="">Load preset…</option>
            { (presets||[]).map(p=> <option key={p.id} value={p.id}>{p.name}</option>) }
            { BUILTIN_PRESETS.map(p=> <option key={p.id} value={p.id}>{p.name}</option>) }
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {actions.map((a, i) => (
          <div key={i} className="border rounded p-2">
            <div className="flex items-start gap-2">
              <div className="w-20 text-sm font-mono">{a.type}</div>
              <div className="flex-1">
                {a.type === 'click' && (
                  <div>
                    <label className="text-xs">Selector</label>
                    <input value={(a as any).selector} onChange={(e)=>updateAction(i, { ...(a as any), selector: e.target.value })} className="w-full rounded border px-2 py-1" />
                  </div>
                )}
                {a.type === 'fill' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={(a as any).selector} onChange={(e)=>updateAction(i, { ...(a as any), selector: e.target.value })} className="rounded border px-2 py-1" />
                    <input value={(a as any).value} onChange={(e)=>updateAction(i, { ...(a as any), value: e.target.value })} className="rounded border px-2 py-1" />
                  </div>
                )}
                {a.type === 'wait' && (
                  <div>
                    <label className="text-xs">ms</label>
                    <input type="number" value={(a as any).ms} onChange={(e)=>updateAction(i, { ...(a as any), ms: Number(e.target.value) })} className="rounded border px-2 py-1" />
                  </div>
                )}
                {a.type === 'eval' && (
                  <div>
                    <label className="text-xs">script</label>
                    <textarea value={(a as any).script} onChange={(e)=>updateAction(i, { ...(a as any), script: e.target.value })} className="w-full rounded border px-2 py-1" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={()=>move(i, -1)} disabled={i===0}>↑</Button>
                <Button size="sm" onClick={()=>move(i, 1)} disabled={i===actions.length-1}>↓</Button>
                <Button size="sm" variant="destructive" onClick={()=>removeAction(i)}>✕</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input placeholder="Preset name" value={presetName} onChange={(e)=>setPresetName(e.target.value)} className="rounded border px-2 py-1" />
        <input placeholder="Description" value={presetDesc} onChange={(e)=>setPresetDesc(e.target.value)} className="rounded border px-2 py-1" />
        <Button onClick={savePreset} disabled={!onSavePreset}>Save as preset</Button>
      </div>

    </div>
  );
};

export default ActionEditor;
