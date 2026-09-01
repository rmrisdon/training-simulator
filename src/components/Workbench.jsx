import { Send, RotateCcw, ListChecks, PenLine, Tags } from 'lucide-react'
import SectionCard from './SectionCard.jsx'
import MacroPicker from './MacroPicker.jsx'
import { WRITING_RULES } from '../utils/scoring.js'

const QUALITY_STYLES = {
  optimal: 'text-lime-dim',
  acceptable: 'text-snagit',
  poor: 'text-rose-600',
}

export default function Workbench({
  scenario,
  stepIndex,
  selectedOptionId,
  lastFeedback,
  history,
  draft,
  selectedMacro,
  onDraft,
  onSelectMacro,
  onChoose,
  onContinue,
  onSubmit,
  onReset,
  canSubmit,
}) {
  if (!scenario) {
    return (
      <section className="flex h-full items-center justify-center p-6 text-center text-slate-500">
        Diagnostic steps and the draft-reply workbench appear here after you open a ticket.
      </section>
    )
  }

  const complete = stepIndex >= scenario.diagnosticSteps.length
  const step = scenario.diagnosticSteps[stepIndex]
  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          2 · Diagnose · 3 · Tag · 4 · Reply
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-white hover:text-slate-800"
        >
          <RotateCcw size={12} />
          Reset ticket
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {['Diagnose', 'Tag', 'Draft', 'Submit'].map((label, index) => {
          const tagged = Boolean(selectedMacro)
          const state =
            !complete && index === 0
              ? 'active'
              : complete && !tagged && index === 1
                ? 'active'
                : complete && tagged && index === 2
                  ? 'active'
                  : complete && canSubmit && index === 3
                    ? 'ready'
                    : 'idle'
          return (
            <div
              key={label}
              className={`rounded-lg px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide ${
                state === 'active'
                  ? 'bg-lime text-ink-950'
                  : state === 'ready'
                    ? 'bg-white text-snagit ring-1 ring-snagit/30'
                    : 'bg-white text-slate-400 ring-1 ring-slate-200'
              }`}
            >
              {index + 1} · {label}
            </div>
          )
        })}
      </div>

      <div className="flex gap-1.5">
        {scenario.diagnosticSteps.map((item, index) => (
          <div
            key={item.id}
            className={`h-1.5 flex-1 rounded-full ${
              index < history.length ? 'bg-lime' : index === stepIndex ? 'bg-lime/50' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {!complete && step && (
        <SectionCard
          title={`Diagnostic step ${stepIndex + 1} of ${scenario.diagnosticSteps.length}`}
          icon={ListChecks}
          tone="teal"
        >
          <h3 className="text-base font-semibold text-slate-900">{step.prompt}</h3>
          <div className="mt-4 space-y-2">
            {step.options.map((option) => {
              const active = selectedOptionId === option.id
              return (
                <label
                  key={option.id}
                  className={`block cursor-pointer rounded-xl border px-3 py-3 text-sm leading-relaxed transition ${
                    active
                      ? 'border-lime bg-lime/10 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-lime/40'
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
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className={`text-xs font-bold uppercase tracking-wider ${QUALITY_STYLES[lastFeedback.quality]}`}>
                {lastFeedback.quality}
              </p>
              <p className="mt-1 text-sm text-slate-700">{lastFeedback.feedback}</p>
              <button
                type="button"
                onClick={onContinue}
                className="mt-3 rounded-lg bg-lime px-3 py-1.5 text-sm font-bold text-ink-950 hover:bg-lime-bright"
              >
                Continue
              </button>
            </div>
          )}
        </SectionCard>
      )}

      {complete && (
        <div className="rounded-xl border border-lime/30 bg-lime/10 px-4 py-3 text-sm text-slate-800">
          Diagnostic tree complete. Choose the matching Zendesk macro, then draft the customer reply.
        </div>
      )}

      {complete && (
        <SectionCard title="Tag with a Zendesk macro" icon={Tags} tone="sky" hint="4 choices">
          <MacroPicker choices={scenario.macroChoices ?? []} selectedTitle={selectedMacro} onSelect={onSelectMacro} />
        </SectionCard>
      )}

      {history.length > 0 && (
        <SectionCard
          title="Path so far"
          icon={ListChecks}
          tone="violet"
          collapsible
          defaultOpen={false}
          hint={`${history.length} choice${history.length === 1 ? '' : 's'}`}
        >
          <ol className="space-y-2">
            {history.map((entry, index) => (
              <li key={`${entry.stepId}-${entry.optionId}`} className="text-xs text-slate-500">
                <span className="font-semibold text-slate-800">S{index + 1}.</span>{' '}
                <span className={QUALITY_STYLES[entry.quality]}>{entry.quality}</span>
                <span className="mt-0.5 block text-slate-500">{entry.label}</span>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}

      <SectionCard title="Draft reply workbench" icon={PenLine} tone="orange" hint={`${wordCount} words`}>
        <textarea
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          placeholder={`Write the customer-facing reply you would send. Aim for ${WRITING_RULES.minWords}–${WRITING_RULES.maxWords} words with an apology and a short acknowledgment, plus the documented next steps.`}
          className="min-h-[220px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-800 outline-none ring-lime/30 placeholder:text-slate-400 focus:ring-2"
        />
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Writing (25 pts): {WRITING_RULES.wordPoints} for {WRITING_RULES.minWords}–{WRITING_RULES.maxWords}{' '}
          words, {WRITING_RULES.apologyPoints} for an apology (sorry / apologize),{' '}
          {WRITING_RULES.acknowledgmentPoints} for an acknowledgment (understand, frustrating, inconvenience,
          or similar). Knowledge keywords are scored separately after you submit.
        </p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-lime-bright disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          <Send size={16} />
          Submit for Review
        </button>
        {!canSubmit && (
          <p className="mt-2 text-[11px] text-slate-500">
            Complete every diagnostic step, tag the ticket with a macro, and write a reply (at least{' '}
            {WRITING_RULES.minWords} words) before submitting.
          </p>
        )}
      </SectionCard>
    </section>
  )
}
