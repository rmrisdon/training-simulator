import { useEffect } from 'react'
import { ArrowLeft, CheckCircle2, CircleAlert, X } from 'lucide-react'

function Bucket({ item }) {
  const width = item.max === 0 ? 0 : Math.round((item.earned / item.max) * 100)
  return (
    <div className="rounded-xl border border-white/10 bg-ink-950/60 p-3">
      <div className="flex items-start justify-between gap-3 text-sm">
        <p className="font-medium text-slate-100">{item.label}</p>
        <p className="shrink-0 font-mono text-slate-300">
          {item.earned}/{item.max}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
      </div>
      {item.missed > 0 ? (
        <p className="mt-2 text-xs text-rose-300">Missed {item.missed} pts</p>
      ) : (
        <p className="mt-2 text-xs text-emerald-300">Full credit</p>
      )}
    </div>
  )
}

export default function ReviewModal({ result, scenario, onRevise, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onRevise()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onRevise])

  if (!result) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/70 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onRevise}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="my-6 w-full max-w-2xl rounded-2xl border border-white/10 bg-ink-800 p-5 shadow-panel sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Submit for Review · {scenario.ticketId}
            </p>
            <h2 id="review-title" className="mt-1 text-2xl font-semibold text-white">
              Grade {result.grade} · {result.overall}/100
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {result.missedPoints === 0
                ? 'No points missed against this ticket’s rubric.'
                : `${result.missedPoints} points missed against the rubric.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onRevise}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close review"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {result.breakdown.map((item) => (
            <Bucket key={item.id} item={item} />
          ))}
        </div>

        {result.diagnostic.details.some((step) => step.quality !== 'optimal') && (
          <div className="mt-5 rounded-xl border border-white/10 bg-ink-950/50 p-4">
            <h3 className="text-sm font-semibold text-white">Diagnostic path</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {result.diagnostic.details.map((step) => (
                <li key={step.index} className="flex gap-2">
                  {step.quality === 'optimal' ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                  ) : (
                    <CircleAlert size={16} className="mt-0.5 shrink-0 text-rose-300" />
                  )}
                  <span>
                    <span className="font-medium text-slate-100">Step {step.index}</span>
                    {step.quality === 'optimal' ? (
                      ' — correct.'
                    ) : (
                      <>
                        {' '}
                        — {step.quality}. Optimal: {step.optimalLabel}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.keywords.missedKeywords.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
            <h3 className="text-sm font-semibold text-amber-200">Missed keywords (−{result.keywords.missed} pts)</h3>
            <p className="mt-2 flex flex-wrap gap-2">
              {result.keywords.missedKeywords.map((term) => (
                <span key={term} className="rounded-md bg-ink-950 px-2 py-1 font-mono text-xs text-amber-100">
                  {term}
                </span>
              ))}
            </p>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-white/10 bg-ink-950/50 p-4">
          <h3 className="text-sm font-semibold text-white">Actionable feedback</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
            {result.feedback.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRevise}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            <ArrowLeft size={16} />
            Revise reply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-teal-300"
          >
            Back to queue
          </button>
        </div>
      </div>
    </div>
  )
}
