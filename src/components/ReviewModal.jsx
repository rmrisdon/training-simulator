import { useEffect } from 'react'
import { ArrowLeft, CheckCircle2, CircleAlert, X } from 'lucide-react'

function Bucket({ item }) {
  const width = item.max === 0 ? 0 : Math.round((item.earned / item.max) * 100)
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3 text-sm">
        <p className="font-medium text-slate-800">{item.label}</p>
        <p className="shrink-0 font-mono text-slate-500">
          {item.earned}/{item.max}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-lime" style={{ width: `${width}%` }} />
      </div>
      {item.missed > 0 ? (
        <p className="mt-2 text-xs text-rose-600">Missed {item.missed} pts</p>
      ) : (
        <p className="mt-2 text-xs text-lime-dim">Full credit</p>
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onRevise}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="my-6 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-pop sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-dim">
              Submit for Review · {scenario.ticketId}
            </p>
            <h2 id="review-title" className="mt-1 text-2xl font-semibold text-slate-900">
              Grade {result.grade} · {result.overall}/100
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {result.missedPoints === 0
                ? 'No points missed against this ticket’s rubric.'
                : `${result.missedPoints} points missed against the rubric.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onRevise}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close review"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {result.breakdown.map((item) => (
            <Bucket key={item.id} item={item} />
          ))}
        </div>

        {result.diagnostic.details.some((step) => step.quality !== 'optimal') && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Diagnostic path</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {result.diagnostic.details.map((step) => (
                <li key={step.index} className="flex gap-2">
                  {step.quality === 'optimal' ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-lime-dim" />
                  ) : (
                    <CircleAlert size={16} className="mt-0.5 shrink-0 text-rose-500" />
                  )}
                  <span>
                    <span className="font-medium text-slate-800">Step {step.index}</span>
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

        {result.macros && result.macros.quality !== 'unscored' && (
          <div
            className={`mt-4 rounded-xl border p-4 ${
              result.macros.quality === 'optimal'
                ? 'border-lime/30 bg-lime/10'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <h3
              className={`text-sm font-semibold ${
                result.macros.quality === 'optimal' ? 'text-lime-dim' : 'text-amber-800'
              }`}
            >
              Macro tagging
              {result.macros.quality === 'optimal'
                ? ' — correct'
                : result.macros.missed > 0
                  ? ` (−${result.macros.missed} pts)`
                  : ''}
            </h3>
            {result.macros.selectedTitle ? (
              <p className="mt-2 text-sm text-slate-700">
                You tagged: <span className="font-medium">{result.macros.selectedTitle}</span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-700">No macro was selected.</p>
            )}
            {result.macros.quality !== 'optimal' && result.macros.correct?.[0] ? (
              <p className="mt-1 text-sm text-slate-700">
                Best tag: <span className="font-medium">{result.macros.correct[0]}</span>
              </p>
            ) : null}
            {result.macros.rationale ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{result.macros.rationale}</p>
            ) : null}
          </div>
        )}

        {result.keywords.missedKeywords.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-800">Missed keywords (−{result.keywords.missed} pts)</h3>
            <p className="mt-2 flex flex-wrap gap-2">
              {result.keywords.missedKeywords.map((term) => (
                <span key={term} className="rounded-md bg-white px-2 py-1 font-mono text-xs text-amber-900 ring-1 ring-amber-200">
                  {term}
                </span>
              ))}
            </p>
          </div>
        )}

        {result.writing && result.writing.missed > 0 && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
            <h3 className="text-sm font-semibold text-violet-800">
              Word count & empathy (−{result.writing.missed} pts)
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              {result.writing.wordCount} words
              {result.writing.hasApology ? ' · apology found' : ' · no apology'}
              {result.writing.hasAcknowledgment || result.writing.hasUnderstand
                ? ' · acknowledgment found'
                : ' · no acknowledgment'}
            </p>
            {(result.writing.wordNote || result.writing.empathyMisses?.length > 0) && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {result.writing.wordNote ? <li>{result.writing.wordNote}</li> : null}
                {(result.writing.empathyMisses ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Actionable feedback</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            {result.feedback.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRevise}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Revise reply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-ink-950 hover:bg-lime-bright"
          >
            Back to queue
          </button>
        </div>
      </div>
    </div>
  )
}
