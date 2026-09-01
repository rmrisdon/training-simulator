import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  FileUp,
  FlaskConical,
  HeartHandshake,
  KeyRound,
  LayoutDashboard,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { parseReviewMarkdown, summarizeEvaluations } from '../utils/parseReview.js'
import AnswerKey from './AnswerKey.jsx'

const PASS_MARK = 70

function gradeTone(grade, score) {
  if (score >= 90 || grade === 'A') return 'bg-lime/15 text-lime-dim ring-lime/25'
  if (score >= 80 || grade === 'B') return 'bg-teal-50 text-camtasia ring-teal-200'
  if (score >= PASS_MARK || grade === 'C') return 'bg-amber-50 text-amber-800 ring-amber-200'
  return 'bg-rose-50 text-rose-700 ring-rose-200'
}

function gapTone(kind) {
  if (kind === 'keyword') return 'bg-amber-50 text-amber-800 ring-amber-200'
  return 'bg-violet-50 text-audiate ring-violet-200'
}

function recIcon(type) {
  if (type === 'diagnostic') return FlaskConical
  if (type === 'keywords') return BookOpen
  return HeartHandshake
}

function recTone(type) {
  if (type === 'diagnostic') return { bar: 'border-l-camtasia', icon: 'text-camtasia' }
  if (type === 'keywords') return { bar: 'border-l-snagit', icon: 'text-snagit' }
  return { bar: 'border-l-audiate', icon: 'text-audiate' }
}

function MetricCard({ label, value, hint, tone = 'lime' }) {
  const accents = {
    lime: 'border-l-lime',
    teal: 'border-l-camtasia',
    violet: 'border-l-audiate',
  }
  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-card ${accents[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

function RubricBar({ item }) {
  if (!item) return null
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

function DetailDrawer({ evaluation, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!evaluation) return null

  const rubricItems = ['diagnostic', 'keywords', 'writing', 'macros']
    .map((id) => evaluation.rubric[id])
    .filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="eval-drawer-title"
        className="flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lime-dim">
              Evaluation · {evaluation.ticketId || 'Ticket'}
            </p>
            <h2 id="eval-drawer-title" className="mt-1 text-xl font-semibold text-slate-900">
              {evaluation.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {evaluation.agentName}
              {evaluation.product ? ` · ${evaluation.product}` : ''}
              {evaluation.submittedAt ? ` · ${evaluation.submittedAt}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close evaluation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-bold ring-1 ${gradeTone(
                evaluation.grade,
                evaluation.overall,
              )}`}
            >
              {evaluation.grade} · {evaluation.overall}/100
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                evaluation.passed
                  ? 'bg-lime/15 text-lime-dim ring-lime/25'
                  : 'bg-rose-50 text-rose-700 ring-rose-200'
              }`}
            >
              {evaluation.passed ? 'Pass' : 'Needs coaching'}
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {rubricItems.map((item) => (
              <RubricBar key={item.id} item={item} />
            ))}
          </div>

          {evaluation.missedDiagnosticSteps.length > 0 ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Missed diagnostic steps</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {evaluation.missedDiagnosticSteps.map((step) => (
                  <li key={`${step.index}-${step.prompt}`} className="flex gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />
                    <span>
                      <span className="font-medium text-slate-800">Step {step.index}</span>
                      {step.quality !== 'unknown' ? ` — ${step.quality}` : ''}.
                      {step.optimalLabel ? ` Optimal: ${step.optimalLabel}` : ` ${step.prompt}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-lime/30 bg-lime/10 p-4 text-sm text-lime-dim">
              All diagnostic steps earned full credit.
            </div>
          )}

          {evaluation.missedKeywords.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-800">Missed required keywords</h3>
              <p className="mt-2 flex flex-wrap gap-2">
                {evaluation.missedKeywords.map((term) => (
                  <span
                    key={term}
                    className="rounded-md bg-white px-2 py-1 font-mono text-xs text-amber-900 ring-1 ring-amber-200"
                  >
                    {term}
                  </span>
                ))}
              </p>
            </div>
          ) : null}

          {evaluation.coaching.length > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Coaching notes</h3>
              <ul className="mt-3 space-y-3">
                {evaluation.coaching.map((rec) => {
                  const Icon = recIcon(rec.type)
                  return (
                    <li key={rec.type} className="flex gap-2 text-sm text-slate-600">
                      <Icon size={16} className="mt-0.5 shrink-0 text-lime-dim" />
                      <span>
                        <span className="font-medium text-slate-800">{rec.title}.</span> {rec.detail}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-lime/30 bg-lime/10 p-4 text-sm text-lime-dim">
              Full rubric credit — no automated coaching recommended.
            </div>
          )}

          {evaluation.feedback.length > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Actionable rewrite notes</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {evaluation.feedback.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {evaluation.macro?.selectedTitle ? (
            <p className="mt-4 text-xs text-slate-500">
              Macro tagged: <span className="font-medium text-slate-700">{evaluation.macro.selectedTitle}</span>
              {evaluation.macro.quality && evaluation.macro.quality !== '—'
                ? ` (${evaluation.macro.quality})`
                : ''}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

export default function AdminDashboard() {
  const inputRef = useRef(null)
  const [tab, setTab] = useState('reviews')
  const [dragOver, setDragOver] = useState(false)
  const [evaluations, setEvaluations] = useState([])
  const [errors, setErrors] = useState([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [agentOverride, setAgentOverride] = useState('')
  const [busy, setBusy] = useState(false)

  const selected = evaluations.find((item) => item.id === selectedId) ?? null
  const summary = useMemo(() => summarizeEvaluations(evaluations), [evaluations])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return evaluations
    return evaluations.filter((item) =>
      [item.agentName, item.title, item.ticketId, item.product, item.grade, String(item.overall)]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [evaluations, query])

  const ingestFiles = useCallback(async (fileList) => {
    const files = [...fileList].filter((file) => /\.md$/i.test(file.name) || file.type.includes('markdown'))
    if (files.length === 0) {
      setErrors(['Upload Markdown (.md) review exports from the simulator.'])
      return
    }

    setBusy(true)
    const nextErrors = []
    const incoming = []
    const override = agentOverride.trim()

    await Promise.all(
      files.map(async (file) => {
        try {
          const text = await file.text()
          const parsed = parseReviewMarkdown(text, file.name)
          if (parsed.error || parsed.evaluations.length === 0) {
            nextErrors.push(`${file.name}: ${parsed.error || 'No ticket reviews found.'}`)
            return
          }
          for (const item of parsed.evaluations) {
            const named = item.agentName !== 'Unknown agent' ? item.agentName : parsed.agentName
            incoming.push({
              ...item,
              agentName: named || override || 'Unknown agent',
            })
          }
        } catch {
          nextErrors.push(`${file.name}: could not be read.`)
        }
      }),
    )

    setEvaluations((current) => {
      const kept = current.filter(
        (item) => !incoming.some((next) => next.sourceFile === item.sourceFile && next.ticketId === item.ticketId),
      )
      return [...kept, ...incoming]
    })
    setErrors(nextErrors)
    setBusy(false)
  }, [agentOverride])

  function onDrop(event) {
    event.preventDefault()
    setDragOver(false)
    ingestFiles(event.dataTransfer.files)
  }

  function removeEvaluation(id) {
    setEvaluations((current) => current.filter((item) => item.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f4f6f8]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime-dim">Team lead workspace</p>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <LayoutDashboard size={22} className="text-lime-dim" />
              QA Admin Dashboard
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              {tab === 'answer-key'
                ? 'Generate the answer key so QA can see exactly how each ticket is graded.'
                : `Drop exported review Markdown files to score coaching themes across agents. Pass mark is ${PASS_MARK}/100.`}
            </p>
          </div>
          {tab === 'reviews' && evaluations.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setEvaluations([])
                setSelectedId(null)
                setErrors([])
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 size={16} />
              Clear reviews
            </button>
          ) : null}
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setTab('reviews')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${
              tab === 'reviews' ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck size={14} />
            Reviews
          </button>
          <button
            type="button"
            onClick={() => setTab('answer-key')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${
              tab === 'answer-key' ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound size={14} />
            Answer key
          </button>
        </div>

        {tab === 'answer-key' ? <AnswerKey /> : null}

        {tab === 'reviews' ? (
        <>
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed bg-white p-6 shadow-card transition ${
            dragOver ? 'border-lime bg-lime/10' : 'border-slate-300'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/15 text-lime-dim">
              <Upload size={22} />
            </div>
            <p className="mt-3 text-base font-semibold text-slate-900">Drop review exports here</p>
            <p className="mt-1 text-sm text-slate-500">
              Accepts one or more <span className="font-mono text-xs">.md</span> files from Export reviews.
            </p>
            <div className="mt-4 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Agent
                </span>
                <input
                  value={agentOverride}
                  onChange={(event) => setAgentOverride(event.target.value)}
                  placeholder="Optional name for files without one"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-ink-950 hover:bg-lime-bright disabled:opacity-60"
              >
                <FileUp size={16} />
                {busy ? 'Reading…' : 'Select files'}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".md,text/markdown"
                multiple
                className="hidden"
                onChange={(event) => {
                  ingestFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </div>
          </div>
        </div>

        {errors.length > 0 ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {errors.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : null}

        {evaluations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-card">
            <ClipboardCheck size={28} className="mx-auto text-slate-300" />
            <h3 className="mt-3 text-lg font-semibold text-slate-900">No evaluations loaded</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Export a review from the Agent Simulator, then drop the Markdown file here to see scores, gaps, and
              coaching recommendations.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Average score"
                value={`${summary.avgScore}/100`}
                hint="Mean overall score across loaded attempts"
              />
              <MetricCard
                label="Pass rate"
                value={`${summary.passRate}%`}
                hint={`${summary.passed} of ${summary.total} scored ${PASS_MARK}+`}
                tone="teal"
              />
              <MetricCard
                label="Evaluations reviewed"
                value={summary.total}
                hint={`${new Set(evaluations.map((item) => item.agentName)).size} agent${
                  new Set(evaluations.map((item) => item.agentName)).size === 1 ? '' : 's'
                }`}
                tone="violet"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 border-l-4 border-l-snagit bg-white p-5 shadow-card">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-snagit">Top knowledge gaps</h3>
                {summary.topGaps.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No missed diagnostic steps or keywords in this set.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {summary.topGaps.map((gap) => (
                      <li
                        key={`${gap.kind}-${gap.label}`}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <span
                            className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${gapTone(
                              gap.kind,
                            )}`}
                          >
                            {gap.kind === 'keyword' ? 'Keyword' : 'Diagnostic'}
                          </span>
                          <p className="mt-1 text-sm leading-snug text-slate-800">{gap.label}</p>
                        </div>
                        <span className="shrink-0 font-mono text-sm font-semibold text-slate-500">{gap.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 border-l-4 border-l-lime bg-white p-5 shadow-card">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-lime-dim">
                  Automated coaching recommendations
                </h3>
                {summary.recommendations.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Every loaded attempt earned full credit on diagnostic, keywords, and empathy.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {summary.recommendations.map((rec) => {
                      const Icon = recIcon(rec.type)
                      const tone = recTone(rec.type)
                      return (
                        <li
                          key={rec.title}
                          className={`rounded-xl border border-slate-200 border-l-4 bg-slate-50 p-3 ${tone.bar}`}
                        >
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Icon size={16} className={tone.icon} />
                            {rec.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{rec.detail}</p>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ticket attempts</h3>
                <label className="flex min-w-[12rem] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:max-w-xs">
                  <Search size={14} className="text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Filter by agent, ticket, score…"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Agent name</th>
                      <th className="px-5 py-3">Scenario</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                          No attempts match that filter.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((item) => (
                        <tr
                          key={item.id}
                          className="cursor-pointer border-t border-slate-100 hover:bg-lime/[0.06]"
                          onClick={() => setSelectedId(item.id)}
                        >
                          <td className="px-5 py-3 font-medium text-slate-800">{item.agentName}</td>
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-800">{item.title}</p>
                            <p className="font-mono text-[11px] text-lime-dim">{item.ticketId}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${gradeTone(
                                item.grade,
                                item.overall,
                              )}`}
                            >
                              {item.grade} · {item.overall}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setSelectedId(item.id)
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-lime/40 hover:bg-lime/10"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  removeEvaluation(item.id)
                                }}
                                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                                aria-label={`Remove ${item.ticketId}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        </>
        ) : null}
      </div>

      {selected ? <DetailDrawer evaluation={selected} onClose={() => setSelectedId(null)} /> : null}
    </div>
  )
}
