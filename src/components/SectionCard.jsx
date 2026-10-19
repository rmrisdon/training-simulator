import { ChevronDown } from 'lucide-react'

const TONE = {
  lime: {
    bar: 'border-l-lime',
    title: 'text-lime-dim',
    chip: 'bg-lime/15',
  },
  orange: {
    bar: 'border-l-snagit',
    title: 'text-snagit',
    chip: 'bg-orange-50',
  },
  teal: {
    bar: 'border-l-camtasia',
    title: 'text-camtasia',
    chip: 'bg-teal-50',
  },
  violet: {
    bar: 'border-l-audiate',
    title: 'text-audiate',
    chip: 'bg-violet-50',
  },
  sky: {
    bar: 'border-l-screencast',
    title: 'text-screencast',
    chip: 'bg-sky-50',
  },
}

function CardHeader({ icon: Icon, title, hint, look, chevron = false }) {
  return (
    <>
      {Icon ? (
        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${look.chip}`}>
          <Icon size={15} className={look.title} />
        </span>
      ) : null}
      <h3 className={`text-xs font-bold uppercase tracking-[0.16em] ${look.title}`}>{title}</h3>
      {hint ? <span className="ml-auto text-[11px] text-slate-500">{hint}</span> : <span className="ml-auto" />}
      {chevron ? <ChevronDown size={16} className="section-chevron shrink-0 text-slate-400 transition" /> : null}
    </>
  )
}

export default function SectionCard({
  title,
  icon: Icon,
  tone = 'lime',
  collapsible = false,
  defaultOpen = true,
  hint,
  children,
}) {
  const look = TONE[tone] ?? TONE.lime
  const className = `rounded-xl border border-slate-200 border-l-[5px] bg-white ${look.bar} shadow-card`

  if (!collapsible) {
    return (
      <section className={className}>
        <div className="flex items-center gap-2 px-5 pt-4">
          <CardHeader icon={Icon} title={title} hint={hint} look={look} />
        </div>
        <div className="px-5 pb-5 pt-3">{children}</div>
      </section>
    )
  }

  return (
    <details open={defaultOpen} className={className}>
      <summary className="flex cursor-pointer items-center gap-2 px-5 py-4">
        <CardHeader icon={Icon} title={title} hint={hint} look={look} chevron />
      </summary>
      <div className="border-t border-slate-100 px-5 pb-5 pt-3">{children}</div>
    </details>
  )
}
