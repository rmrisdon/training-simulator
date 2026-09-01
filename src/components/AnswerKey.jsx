import { useMemo, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  Download,
  KeyRound,
  ListChecks,
  Search,
  Tags,
} from 'lucide-react'
import { loadScenarios } from '../data/scenarios.js'
import { buildAnswerKeyCatalog, downloadAnswerKey } from '../utils/answerKey.js'
import { RUBRIC_WEIGHTS, WRITING_RULES } from '../utils/scoring.js'

function Chip({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    lime: 'bg-lime/15 text-lime-dim',
    amber: 'bg-amber-50 text-amber-800',
  }
  return (
    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

function ScenarioKey({ entry, open, onToggle }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] text-lime-dim">{entry.ticketId}</p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-900">{entry.title}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip>{entry.product}</Chip>
            <Chip>{entry.difficulty}</Chip>
            <Chip>{entry.category}</Chip>
            {entry.intent ? <Chip tone="lime">{entry.intent}</Chip> : null}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`mt-1 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="space-y-4 border-t border-slate-100 px-5 py-4">
          {entry.summary ? <p className="text-sm leading-relaxed text-slate-600">{entry.summary}</p> : null}

          <section>
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-camtasia">
              <ListChecks size={14} />
              Optimal diagnostic path
            </h4>
            <ol className="mt-2 space-y-3">
              {entry.diagnostic.map((step) => (
                <li key={step.index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-800">
                    Step {step.index}. {step.prompt}
                  </p>
                  <p className="mt-2 text-sm text-lime-dim">
                    <span className="font-semibold">Optimal:</span> {step.optimalLabel || '—'}
                  </p>
                  {step.acceptable.map((option) => (
                    <p key={option.label} className="mt-1 text-sm text-amber-800">
                      <span className="font-semibold">Acceptable (half):</span> {option.label}
                    </p>
                  ))}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-screencast">
              <Tags size={14} />
              Macro tagging
            </h4>
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Correct:</span>{' '}
                {entry.macros.correct[0] || '—'}
              </p>
              {entry.macros.acceptable.length > 0 ? (
                <p className="mt-1">
                  <span className="font-semibold text-slate-900">Acceptable (half):</span>{' '}
                  {entry.macros.acceptable.join('; ')}
                </p>
              ) : null}
              {entry.macros.rationale ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{entry.macros.rationale}</p>
              ) : null}
            </div>
          </section>

          <section>
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-snagit">
              <BookOpen size={14} />
              Required keywords
            </h4>
            <p className="mt-2 flex flex-wrap gap-2">
              {entry.keywords.map((term) => (
                <span
                  key={term}
                  className="rounded-md bg-amber-50 px-2 py-1 font-mono text-xs text-amber-900 ring-1 ring-amber-200"
                >
                  {term}
                </span>
              ))}
            </p>
          </section>

          <section>
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Reply content</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {entry.tone ? <li>Tone: {entry.tone}</li> : null}
              {entry.requiredElements.map((item) => (
                <li key={item}>{item}</li>
              ))}
              {entry.incorrectTerms.length > 0 ? (
                <li>Do not use: {entry.incorrectTerms.join('; ')}</li>
              ) : null}
            </ul>
            {entry.modelReplyHints.length > 0 ? (
              <div className="mt-3 rounded-xl border border-lime/30 bg-lime/10 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lime-dim">
                  Model-reply hints
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {entry.modelReplyHints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </article>
  )
}

export default function AnswerKey() {
  const scenarios = useMemo(() => loadScenarios(), [])
  const catalog = useMemo(() => buildAnswerKeyCatalog(scenarios), [scenarios])
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return catalog
    return catalog.filter((entry) =>
      [
        entry.ticketId,
        entry.title,
        entry.product,
        entry.intent,
        entry.difficulty,
        entry.category,
        ...entry.keywords,
        entry.macros.correct[0],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [catalog, query])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime-dim">Grading reference</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <KeyRound size={22} className="text-lime-dim" />
            Answer key
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
            Optimal diagnostic choices, correct macros, required keywords, and the writing rubric for every
            remaining knowledge-check ticket.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadAnswerKey(scenarios)}
          className="inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-ink-950 hover:bg-lime-bright"
        >
          <Download size={16} />
          Download Markdown
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 border-l-4 border-l-lime bg-white p-5 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-lime-dim">How a ticket is scored</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="pb-2 pr-4">Area</th>
                <th className="pb-2 pr-4">Points</th>
                <th className="pb-2">What earns credit</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-4 font-medium">Correct diagnostic steps</td>
                <td className="py-2 pr-4 font-mono">{RUBRIC_WEIGHTS.diagnostic}</td>
                <td className="py-2">Optimal choice on each step. Acceptable choices earn half.</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-4 font-medium">Macro tagging</td>
                <td className="py-2 pr-4 font-mono">{RUBRIC_WEIGHTS.macros}</td>
                <td className="py-2">The listed correct Zendesk macro. An acceptable tag earns half.</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-4 font-medium">Required keywords</td>
                <td className="py-2 pr-4 font-mono">{RUBRIC_WEIGHTS.keywords}</td>
                <td className="py-2">Each listed phrase must appear in the reply. Capitalization and punctuation do not matter.</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-4 font-medium">Word count & empathy</td>
                <td className="py-2 pr-4 font-mono">{RUBRIC_WEIGHTS.writing}</td>
                <td className="py-2">
                  {WRITING_RULES.wordPoints} pts for {WRITING_RULES.minWords}–{WRITING_RULES.maxWords} words;{' '}
                  {WRITING_RULES.apologyPoints} pts for an apology; {WRITING_RULES.acknowledgmentPoints} pts for
                  an acknowledgment.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Apology language: {WRITING_RULES.apologyExamples.join(', ')}. Acknowledgment language:{' '}
          {WRITING_RULES.acknowledgmentExamples.join(', ')}, or similar.
        </p>
      </section>

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-card">
        <Search size={16} className="text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by ticket, product, keyword, macro…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <span className="shrink-0 text-xs text-slate-400">
          {filtered.length}/{catalog.length}
        </span>
      </label>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
            No scenarios match that search.
          </p>
        ) : (
          filtered.map((entry) => (
            <ScenarioKey
              key={entry.id}
              entry={entry}
              open={openId === entry.id}
              onToggle={() => setOpenId((current) => (current === entry.id ? null : entry.id))}
            />
          ))
        )}
      </div>
    </div>
  )
}
