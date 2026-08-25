import { Clock3, Monitor, UserRound } from 'lucide-react'

export default function TicketPanel({ scenario }) {
  if (!scenario) {
    return (
      <section className="flex h-full items-center justify-center p-8 text-center text-slate-400">
        Select a ticket to inspect the customer record, environment, and logs.
      </section>
    )
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-y-auto p-5">
      <div className="ticket-paper rounded-2xl border border-white/10 bg-ink-800/80 p-5 shadow-panel">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-accent">{scenario.ticketId}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{scenario.title}</h2>
          </div>
          <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300 ring-1 ring-inset ring-rose-400/20">
            {scenario.priority}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-slate-300">{scenario.summary}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-ink-900/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <UserRound size={13} />
              Customer
            </div>
            <p className="text-sm font-medium text-slate-100">{scenario.customer.name}</p>
            <p className="text-xs text-slate-400">{scenario.customer.role}</p>
            <p className="mt-1 text-xs text-slate-400">{scenario.customer.company}</p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">{scenario.customer.email}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-ink-900/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Clock3 size={13} />
              Intake
            </div>
            <p className="text-sm text-slate-200">{scenario.openedAt}</p>
            <p className="mt-1 text-xs text-slate-400">{scenario.product}</p>
            <p className="mt-1 text-xs text-slate-400">{scenario.environment.app}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-ink-800/60 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Issue description</h3>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">
          {scenario.description}
        </pre>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-ink-800/60 p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <Monitor size={14} />
          Environment
        </div>
        <dl className="grid gap-2 text-sm">
          {Object.entries(scenario.environment).map(([key, value]) => (
            <div key={key} className="grid grid-cols-[6.5rem_1fr] gap-3">
              <dt className="shrink-0 text-slate-500">{key.toUpperCase()}</dt>
              <dd className="text-slate-200">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-[#071018] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Crash / diagnostic log</h3>
          <span className="font-mono text-[10px] text-slate-500">read-only</span>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[12px] leading-6 text-cyan-100/90">
          {scenario.crashLog}
        </pre>
      </div>
    </section>
  )
}
