import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Filter,
  FolderOpen,
  Gauge,
} from 'lucide-react'
import { CATEGORIES, DIFFICULTIES } from '../data/scenarios'

const DIFFICULTY_STYLES = {
  'Tier 1': 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/20',
  'Tier 2': 'bg-amber-400/15 text-amber-300 ring-amber-400/20',
  'Escalation Edge Case': 'bg-rose-400/15 text-rose-300 ring-rose-400/20',
}

export default function Sidebar({
  scenarios,
  selectedId,
  onSelect,
  category,
  difficulty,
  onCategory,
  onDifficulty,
  results,
}) {
  const filtered = scenarios.filter((scenario) => {
    const categoryOk = category === 'All' || scenario.category === category
    const difficultyOk = difficulty === 'All' || scenario.difficulty === difficulty
    return categoryOk && difficultyOk
  })

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-white/10 bg-ink-900/80">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          <Filter size={14} />
          Queue filters
        </div>
        <label className="mb-2 block text-[11px] uppercase tracking-wide text-slate-500">Category</label>
        <select
          value={category}
          onChange={(event) => onCategory(event.target.value)}
          className="mb-3 w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-slate-100 outline-none ring-accent/40 focus:ring-2"
        >
          <option>All</option>
          {CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className="mb-2 block text-[11px] uppercase tracking-wide text-slate-500">Difficulty</label>
        <select
          value={difficulty}
          onChange={(event) => onDifficulty(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-slate-100 outline-none ring-accent/40 focus:ring-2"
        >
          <option>All</option>
          {DIFFICULTIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {scenarios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center text-sm text-slate-400">
            Load sample scenarios to populate the training queue.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center text-sm text-slate-400">
            No tickets match those filters.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((scenario) => {
              const selected = scenario.id === selectedId
              const result = results[scenario.id]
              return (
                <li key={scenario.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(scenario.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? 'border-accent/40 bg-accent/10 shadow-panel'
                        : 'border-white/10 bg-ink-800/70 hover:border-white/20 hover:bg-ink-700'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{scenario.ticketId}</span>
                      {result ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
                          <CheckCircle2 size={12} />
                          {result.grade} · {result.overall}
                        </span>
                      ) : (
                        <Circle size={12} className="mt-0.5 text-slate-600" />
                      )}
                    </div>
                    <p className="text-sm font-medium leading-snug text-slate-100">{scenario.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
                        {scenario.product}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${DIFFICULTY_STYLES[scenario.difficulty]}`}
                      >
                        {scenario.difficulty}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <FolderOpen size={13} />
          {scenarios.length} loaded
          <span className="text-slate-600">/</span>
          <Gauge size={13} />
          {Object.keys(results).length} reviewed
        </div>
        <p className="mt-2 flex items-start gap-1.5 leading-relaxed">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          Training data only — not a live TechSmith queue.
        </p>
      </div>
    </aside>
  )
}
