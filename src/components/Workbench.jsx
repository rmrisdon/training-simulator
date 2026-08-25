import { Send, RotateCcw, ListChecks } from 'lucide-react'

const QUALITY_STYLES = {
  optimal: 'text-emerald-300',
  acceptable: 'text-amber-300',
  poor: 'text-rose-300',
}

export default function Workbench({
  scenario,
  stepIndex,
  selectedOptionId,
  lastFeedback,
  history,
  draft,
  onDraft,
  onChoose,
  onContinue,
  onSubmit,
  onReset,
  canSubmit,
}) {
  if (!scenario) {
    return (
      <section className="flex h-full items-center justify-center p-8 text-center text-slate-400">
        Diagnostic steps and the draft-reply workbench appear here after you open a ticket.
      </section>
    )
  }

  const complete = stepIndex >= scenario.diagnosticSteps.length
  const step = scenario.diagnosticSteps[stepIndex]

  return (
    <section className="flex h-full min-h-0 flex-col overflow-y-auto p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <ListChecks size={14} />
          Diagnostic path
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <RotateCcw size={12} />
          Reset ticket
        </button>
      </div>

      <div className="mb-4 flex gap-1.5">
        {scenario.diagnosticSteps.map((item, index) => (
          <div
            key={item.id}
            className={`h-1.5 flex-1 rounded-full ${
              index < history.length ? 'bg-accent' : index === stepIndex ? 'bg-accent/40' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {!complete && step && (
        <div className="rounded-2xl border border-white/10 bg-ink-800/80 p-4 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Step {stepIndex + 1} of {scenario.diagnosticSteps.length}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{step.prompt}</h3>
          <div className="mt-4 space-y-2">
            {step.options.map((option) => {
              const active = selectedOptionId === option.id
              return (
                <label
                  key={option.id}
                  className={`block cursor-pointer rounded-xl border px-3 py-3 text-sm leading-relaxed transition ${
                    active
                      ? 'border-accent/50 bg-accent/10 text-slate-100'
                      : 'border-white/10 bg-ink-900/60 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name={step.id}
                    className="sr-only"
                    checked={active}
                    onChange={() => onChoose(option.id)}
                    disabled={Boolean(lastFeedback)}
                  />
                  {option.label}
                </label>
              )
            })}
          </div>

          {lastFeedback && (
            <div className="mt-4 rounded-xl border border-white/10 bg-ink-950/80 p-3">
              <p className={`text-xs font-semibold uppercase tracking-wider ${QUALITY_STYLES[lastFeedback.quality]}`}>
                {lastFeedback.quality}
              </p>
              <p className="mt-1 text-sm text-slate-300">{lastFeedback.feedback}</p>
              <button
                type="button"
                onClick={onContinue}
                className="mt-3 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-ink-950 hover:bg-teal-300"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      )}

      {complete && (
        <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-teal-100">
          Diagnostic tree complete. Draft the customer reply using what you learned from the ticket and your path.
        </div>
      )}

      {history.length > 0 && (
        <ol className="mt-4 space-y-2">
          {history.map((entry, index) => (
            <li key={`${entry.stepId}-${entry.optionId}`} className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">S{index + 1}.</span>{' '}
              <span className={QUALITY_STYLES[entry.quality]}>{entry.quality}</span>
              <span className="mt-0.5 block text-slate-500">{entry.label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 flex min-h-[280px] flex-1 flex-col rounded-2xl border border-white/10 bg-ink-800/80 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Draft reply workbench</h3>
          <span className="text-[11px] text-slate-500">{draft.trim().split(/\s+/).filter(Boolean).length} words</span>
        </div>
        <textarea
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          placeholder="Write the customer-facing reply you would send on this escalated ticket. Include empathy, the root cause, and numbered next steps."
          className="min-h-[220px] flex-1 resize-y rounded-xl border border-white/10 bg-ink-950/70 p-3 text-sm leading-relaxed text-slate-100 outline-none ring-accent/30 placeholder:text-slate-600 focus:ring-2"
        />
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          <Send size={16} />
          Submit for Review
        </button>
        {!canSubmit && (
          <p className="mt-2 text-[11px] text-slate-500">
            Complete every diagnostic step and write a reply (at least 40 words) before submitting.
          </p>
        )}
      </div>
    </section>
  )
}
