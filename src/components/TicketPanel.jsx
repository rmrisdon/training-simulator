import { BookOpen, Clock3, FileText, Monitor, ScrollText, UserRound } from 'lucide-react'
import SectionCard from './SectionCard.jsx'

const PRIORITY = {
  P1: 'bg-orange-50 text-snagit ring-orange-200',
  P2: 'bg-lime/15 text-lime-dim ring-lime/30',
  P3: 'bg-teal-50 text-camtasia ring-teal-200',
}

export default function TicketPanel({ scenario }) {
  if (!scenario) {
    return (
      <section className="flex h-full items-center justify-center p-6 text-center text-slate-500">
        Select a ticket to inspect the customer record, environment, and logs.
      </section>
    )
  }

  const envHint = `${scenario.environment.os.split('(')[0].trim()} · ${scenario.environment.app}`

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        1 · Read the ticket
      </p>

      <SectionCard title="Customer ticket" icon={FileText} tone="lime" hint={scenario.ticketId}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{scenario.title}</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${PRIORITY[scenario.priority] ?? PRIORITY.P2}`}
          >
            {scenario.priority}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">{scenario.summary}</p>
        {scenario.intent ? (
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Zendesk topic: <span className="font-semibold text-slate-700">{scenario.intent}</span>
            {scenario.intentSubcategory ? ` · ${scenario.intentSubcategory}` : ''}
            {typeof scenario.ticketVolume === 'number'
              ? ` · ${scenario.ticketVolume.toLocaleString()} tickets (2026)`
              : ''}
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-lime-dim">
              <UserRound size={13} />
              Customer
            </div>
            <p className="text-sm font-semibold text-slate-900">{scenario.customer.name}</p>
            <p className="text-xs text-slate-500">{scenario.customer.role}</p>
            <p className="mt-1 text-xs text-slate-500">{scenario.customer.company}</p>
            <p className="mt-1 font-mono text-[11px] text-slate-400">{scenario.customer.email}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-snagit">
              <Clock3 size={13} />
              Intake
            </div>
            <p className="text-sm text-slate-800">{scenario.openedAt}</p>
            <p className="mt-1 text-xs text-slate-500">{scenario.product}</p>
            <p className="mt-1 text-xs text-slate-500">{scenario.environment.app}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Issue description" icon={FileText} tone="orange" collapsible defaultOpen>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
          {scenario.description}
        </pre>
      </SectionCard>

      <SectionCard title="Environment" icon={Monitor} tone="teal" collapsible defaultOpen={false} hint={envHint}>
        <dl className="grid gap-2 text-sm">
          {Object.entries(scenario.environment).map(([key, value]) => (
            <div key={key} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-slate-100 py-1.5 last:border-0">
              <dt className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-camtasia">{key}</dt>
              <dd className="text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <SectionCard
        title="Diagnostic notes"
        icon={ScrollText}
        tone="violet"
        collapsible
        defaultOpen={false}
        hint="read-only · official sourcing"
      >
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-mono text-[12px] leading-6 text-slate-700">
          {scenario.crashLog}
        </pre>
      </SectionCard>

      {Array.isArray(scenario.sources) && scenario.sources.length > 0 ? (
        <SectionCard title="Official sources" icon={BookOpen} tone="lime" collapsible defaultOpen>
          <ul className="space-y-2 text-sm">
            {scenario.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lime-dim underline decoration-lime/40 underline-offset-2 hover:text-slate-900"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Replies must follow these TechSmith pages. Do not invent keys, portal reports, or unpublished fixes.
          </p>
        </SectionCard>
      ) : null}
    </section>
  )
}
