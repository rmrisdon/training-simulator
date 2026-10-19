import { AlertTriangle, ArrowRight, CheckCircle2, Circle, FolderOpen, Gauge, Layers } from 'lucide-react'

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

const CATEGORY_CHIP = {
  Software: 'bg-teal-50 text-camtasia',
  Account: 'bg-orange-50 text-snagit',
  Billing: 'bg-violet-50 text-audiate',
  Misc: 'bg-lime/15 text-lime-dim',
}

function TicketCard({ scenario, result, variant = 'current' }) {
  const faded = variant === 'ondeck'
  return (
    <div
      className={`rounded-xl border border-l-[5px] px-3 py-3 text-left shadow-card ${
        CATEGORY_BAR[scenario.category] ?? 'border-l-lime'
      } ${
        faded
          ? 'border-y-slate-200 border-r-slate-200 bg-white'
          : 'border-y-lime/40 border-r-lime/40 bg-lime/10'
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
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{scenario.intent}</p>
      ) : null}
      <p className="text-sm font-semibold leading-snug text-slate-900">{scenario.title}</p>
      {scenario.summary ? (
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-slate-500">{scenario.summary}</p>
      ) : null}
      <p className="mt-1.5 text-[11px] text-slate-500">{scenario.customer?.name}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${CATEGORY_CHIP[scenario.category] ?? 'bg-slate-100 text-slate-600'}`}>
          {scenario.category}
        </span>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{scenario.product}</span>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${DIFFICULTY_STYLES[scenario.difficulty]}`}
        >
          {scenario.difficulty}
        </span>
      </div>
    </div>
  )
}

export default function Sidebar({
  current,
  onDeck,
  catalogCount,
  reviewedCount,
  onNext,
  canAdvance,
  results,
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          <Layers size={14} />
          Training queue
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-slate-500">
          Work one live ticket at a time: read the case, choose the documented diagnostic path, tag the matching
          macro, and write a customer reply. Cases are drawn at random from activation, keys, recording, licenses,
          and launch issues.
        </p>
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime px-3 py-2 text-sm font-bold text-ink-950 hover:bg-lime-bright disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200"
        >
          <ArrowRight size={16} />
          Next ticket
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f6f8] px-3 py-3">
        {current ? (
          <div className="space-y-4">
            <section>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-lime-dim">Now working</p>
              <TicketCard scenario={current} result={results[current.id]} />
            </section>
            <section>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">On deck</p>
              {onDeck ? (
                <div className="pointer-events-none select-none opacity-45">
                  <TicketCard scenario={onDeck} result={results[onDeck.id]} variant="ondeck" />
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-sm text-slate-500">
                  No more tickets are waiting.
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-sm text-slate-500">
            No ticket is in progress.
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-2 font-semibold">
          <FolderOpen size={13} className="text-lime-dim" />
          {catalogCount} in catalog
          <span className="text-slate-300">/</span>
          <Gauge size={13} className="text-snagit" />
          {reviewedCount} reviewed
        </div>
        <p className="mt-2 flex items-start gap-1.5 leading-relaxed">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-snagit" />
          Training data only — not a live TechSmith queue. Progress is saved in this browser.
        </p>
      </div>
    </aside>
  )
}
