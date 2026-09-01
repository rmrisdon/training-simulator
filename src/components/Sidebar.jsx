import { AlertTriangle, CheckCircle2, Circle, FolderOpen, Gauge, Shuffle } from 'lucide-react'
import { QUEUE_SIZE } from '../utils/storage.js'

const DIFFICULTY_STYLES = {
  'Tier 1': 'bg-lime/15 text-lime-dim ring-lime/25',
  'Tier 2': 'bg-orange-50 text-snagit ring-orange-200',
  'Escalation Edge Case': 'bg-violet-50 text-audiate ring-violet-200',
}

const CATEGORY_BAR = {
  Software: 'border-l-camtasia',
  Account: 'border-l-snagit',
  Billing: 'border-l-audiate',
  Misc: 'border-l-lime',
}

export default function Sidebar({
  scenarios,
  catalogCount,
  selectedId,
  onSelect,
  onShuffle,
  results,
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          <Shuffle size={14} />
          Training queue
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-slate-500">
          Showing {QUEUE_SIZE} tickets from {catalogCount} knowledge-check scenarios. Shuffle to draw a new set.
        </p>
        <button
          type="button"
          onClick={onShuffle}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime px-3 py-2 text-sm font-bold text-ink-950 hover:bg-lime-bright"
        >
          <Shuffle size={16} />
          Shuffle tickets
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f6f8] px-3 py-3">
        {scenarios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-sm text-slate-500">
            Shuffle the queue to draw training tickets.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {scenarios.map((scenario) => {
              const selected = scenario.id === selectedId
              const result = results[scenario.id]
              return (
                <li key={scenario.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(scenario.id)}
                    className={`w-full rounded-xl border border-l-4 px-3 py-3 text-left shadow-card transition ${
                      CATEGORY_BAR[scenario.category] ?? 'border-l-lime'
                    } ${
                      selected
                        ? 'border-y-lime/40 border-r-lime/40 bg-lime/10 shadow-card-hover'
                        : 'border-y-slate-200 border-r-slate-200 bg-white hover:border-y-slate-300 hover:border-r-slate-300'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="font-mono text-[11px] text-lime-dim">{scenario.ticketId}</span>
                      {result ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-lime-dim">
                          <CheckCircle2 size={12} />
                          {result.grade} · {result.overall}
                        </span>
                      ) : (
                        <Circle size={12} className="mt-0.5 text-slate-300" />
                      )}
                    </div>
                    {scenario.intent ? (
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {scenario.intent}
                      </p>
                    ) : null}
                    <p className="text-sm font-semibold leading-snug text-slate-900">{scenario.title}</p>
                    {scenario.summary ? (
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-slate-500">{scenario.summary}</p>
                    ) : null}
                    <p className="mt-1.5 text-[11px] text-slate-500">{scenario.customer?.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {scenario.category}
                      </span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {scenario.product}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${DIFFICULTY_STYLES[scenario.difficulty]}`}
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

      <div className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-2 font-semibold">
          <FolderOpen size={13} className="text-lime-dim" />
          {scenarios.length} in queue
          <span className="text-slate-300">/</span>
          <Gauge size={13} className="text-snagit" />
          {Object.keys(results).length} reviewed
        </div>
        <p className="mt-2 flex items-start gap-1.5 leading-relaxed">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-snagit" />
          Training data only — not a live TechSmith queue. Progress is saved in this browser.
        </p>
      </div>
    </aside>
  )
}
