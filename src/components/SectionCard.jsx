import { ChevronDown } from 'lucide-react'

const TONE = {
  lime: {
    bar: 'border-l-lime',
    title: 'text-lime-dim',
  },
  orange: {
    bar: 'border-l-snagit',
    title: 'text-snagit',
  },
  teal: {
    bar: 'border-l-camtasia',
    title: 'text-camtasia',
  },
  violet: {
    bar: 'border-l-audiate',
    title: 'text-audiate',
  },
  sky: {
    bar: 'border-l-screencast',
    title: 'text-screencast',
  },
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
  const className = `rounded-xl border border-slate-200 border-l-4 bg-white ${look.bar} shadow-card`

  if (!collapsible) {
    return (
      <section className={className}>
        <div className="flex items-center gap-2 px-5 pt-4">
          {Icon ? <Icon size={16} className={look.title} /> : null}
          <h3 className={`text-xs font-bold uppercase tracking-[0.16em] ${look.title}`}>{title}</h3>
          {hint ? <span className="ml-auto text-[11px] text-slate-500">{hint}</span> : null}
        </div>
        <div className="px-5 pb-5 pt-3">{children}</div>
      </section>
    )
  }

  return (
    <details open={defaultOpen} className={className}>
      <summary className="flex cursor-pointer items-center gap-2 px-5 py-4">
        {Icon ? <Icon size={16} className={look.title} /> : null}
        <h3 className={`text-xs font-bold uppercase tracking-[0.16em] ${look.title}`}>{title}</h3>
        {hint ? <span className="ml-auto text-[11px] text-slate-500">{hint}</span> : <span className="ml-auto" />}
        <ChevronDown size={16} className="section-chevron shrink-0 text-slate-400 transition" />
      </summary>
      <div className="border-t border-slate-100 px-5 pb-5 pt-3">{children}</div>
    </details>
  )
}
