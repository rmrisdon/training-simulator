export default function MacroPicker({ choices = [], selectedTitle, onSelect }) {
  if (choices.length === 0) {
    return (
      <p className="text-sm text-slate-500">No macro options are available for this ticket.</p>
    )
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">
        Which Zendesk macro would you apply to this ticket? Pick the best match — you do not need to
        search the full library.
      </p>
      <div className="mt-4 space-y-2">
        {choices.map((macro) => {
          const active = macro.title === selectedTitle
          const hint = [macro.category, macro.subcategory].filter(Boolean).join(' · ')
          return (
            <label
              key={macro.title}
              className={`block cursor-pointer rounded-xl border px-3 py-3 text-sm leading-relaxed transition ${
                active
                  ? 'border-lime bg-lime/10 text-slate-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-lime/40'
              }`}
            >
              <input
                type="radio"
                name="macro-choice"
                className="sr-only"
                checked={active}
                onChange={() => onSelect(macro.title)}
              />
              <span className="block font-medium text-slate-900">{macro.title}</span>
              {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
              {macro.description ? (
                <span className="mt-1 block text-[12px] leading-snug text-slate-600">{macro.description}</span>
              ) : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}
