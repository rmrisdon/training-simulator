import { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Download, Headset, Trash2 } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import TicketPanel from './components/TicketPanel.jsx'
import Workbench from './components/Workbench.jsx'
import ReviewModal from './components/ReviewModal.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import { loadScenarios } from './data/scenarios.js'
import { scoreSubmission, WRITING_RULES } from './utils/scoring.js'
import { buildReviewMarkdown, downloadReviewMarkdown } from './utils/export.js'
import {
  QUEUE_SIZE,
  clearPersisted,
  emptyWorkbench,
  readPersisted,
  resolveQueue,
  sanitizeWorkbench,
  shuffleIds,
  writePersisted,
} from './utils/storage.js'

function buildInitialSession(allScenarios) {
  const allIds = allScenarios.map((item) => item.id)
  const stored = readPersisted()
  const queueIds = resolveQueue(allIds, stored?.queueIds, QUEUE_SIZE)
  const selectedId = queueIds.includes(stored?.selectedId) ? stored.selectedId : (queueIds[0] ?? null)
  const validIds = new Set(allIds)
  const results = {}
  if (stored?.results) {
    for (const [id, value] of Object.entries(stored.results)) {
      if (validIds.has(id)) results[id] = value
    }
  }
  const workbenches = {}
  if (stored?.workbenches) {
    for (const [id, value] of Object.entries(stored.workbenches)) {
      if (validIds.has(id)) workbenches[id] = sanitizeWorkbench(value)
    }
  }
  return { queueIds, selectedId, results, workbenches }
}

export default function App() {
  const allScenarios = useMemo(() => loadScenarios(), [])
  const [initialSession] = useState(() => buildInitialSession(allScenarios))
  const [queueIds, setQueueIds] = useState(initialSession.queueIds)
  const [selectedId, setSelectedId] = useState(initialSession.selectedId)
  const [workbenches, setWorkbenches] = useState(initialSession.workbenches)
  const [results, setResults] = useState(initialSession.results)
  const [review, setReview] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [view, setView] = useState('simulator')

  const queue = useMemo(
    () => queueIds.map((id) => allScenarios.find((item) => item.id === id)).filter(Boolean),
    [allScenarios, queueIds],
  )
  const scenario = useMemo(
    () => allScenarios.find((item) => item.id === selectedId) ?? null,
    [allScenarios, selectedId],
  )
  const workbench = (selectedId && workbenches[selectedId]) || emptyWorkbench

  useEffect(() => {
    writePersisted({ queueIds, selectedId, results, workbenches })
  }, [queueIds, selectedId, results, workbenches])

  useEffect(() => {
    if (!confirmReset) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setConfirmReset(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmReset])

  function patchWorkbench(updater) {
    if (!selectedId) return
    setWorkbenches((current) => {
      const previous = current[selectedId] ?? emptyWorkbench
      const next = typeof updater === 'function' ? updater(previous) : updater
      return { ...current, [selectedId]: next }
    })
  }

  function selectScenario(id) {
    setSelectedId(id)
    setReview(null)
  }

  function chooseOption(optionId) {
    if (!scenario || workbench.lastFeedback) return
    const step = scenario.diagnosticSteps[workbench.stepIndex]
    const option = step.options.find((item) => item.id === optionId)
    patchWorkbench((current) => ({
      ...current,
      selectedOptionId: optionId,
      lastFeedback: option,
    }))
  }

  function continueStep() {
    if (!scenario || !workbench.lastFeedback) return
    const step = scenario.diagnosticSteps[workbench.stepIndex]
    const option = workbench.lastFeedback
    patchWorkbench((current) => ({
      ...current,
      stepIndex: current.stepIndex + 1,
      selectedOptionId: null,
      lastFeedback: null,
      history: [
        ...current.history,
        { stepId: step.id, optionId: option.id, quality: option.quality, label: option.label },
      ],
    }))
  }

  function submit() {
    if (!scenario) return
    const result = scoreSubmission(scenario, workbench.history, workbench.draft, workbench.selectedMacro)
    const saved = {
      ...result,
      reply: workbench.draft,
      history: workbench.history,
      submittedAt: new Date().toISOString(),
    }
    setReview(result)
    setResults((current) => ({ ...current, [scenario.id]: saved }))
  }

  function exportReviews() {
    if (Object.keys(results).length === 0) return
    downloadReviewMarkdown(buildReviewMarkdown(allScenarios, results, workbenches))
  }

  function shuffleQueue() {
    const allIds = allScenarios.map((item) => item.id)
    let next = shuffleIds(allIds, QUEUE_SIZE)
    const currentSet = new Set(queueIds)
    const sameSet = next.length === queueIds.length && next.every((id) => currentSet.has(id))
    if (sameSet && allIds.length > QUEUE_SIZE) {
      next = shuffleIds(allIds, QUEUE_SIZE)
    }
    setQueueIds(next)
    setSelectedId((current) => (next.includes(current) ? current : (next[0] ?? null)))
    setReview(null)
  }

  function resetSimulator() {
    clearPersisted()
    const next = shuffleIds(
      allScenarios.map((item) => item.id),
      QUEUE_SIZE,
    )
    setQueueIds(next)
    setSelectedId(next[0] ?? null)
    setWorkbenches({})
    setResults({})
    setReview(null)
    setConfirmReset(false)
  }

  const diagnosticsComplete = Boolean(scenario) && workbench.history.length === scenario.diagnosticSteps.length
  const canSubmit =
    diagnosticsComplete &&
    Boolean(workbench.selectedMacro) &&
    workbench.draft.trim().split(/\s+/).filter(Boolean).length >= WRITING_RULES.minWords

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[#f4f6f8] text-slate-800">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime text-ink-950">
            <Headset size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime-dim">TechSmith training</p>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Escalation & Diagnostics Simulator</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setView('simulator')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${
                view === 'simulator'
                  ? 'bg-white text-slate-900 shadow-card'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Headset size={14} />
              Agent Simulator
            </button>
            <button
              type="button"
              onClick={() => setView('admin')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${
                view === 'admin'
                  ? 'bg-white text-slate-900 shadow-card'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardCheck size={14} />
              QA Admin Dashboard
            </button>
          </div>
          {view === 'simulator' ? (
            <>
              <button
                type="button"
                onClick={exportReviews}
                disabled={Object.keys(results).length === 0}
                title={
                  Object.keys(results).length === 0
                    ? 'Submit at least one ticket to export a review'
                    : 'Download a Markdown report of submitted tickets'
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-lime/40 hover:bg-lime/10 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white"
              >
                <Download size={16} />
                Export reviews
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 size={16} />
                Reset simulator
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className={view === 'admin' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
        <AdminDashboard />
      </div>

      {view === 'simulator' && allScenarios.length === 0 ? (
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <h2 className="text-2xl font-bold text-slate-900">No scenarios available</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              The training catalog did not load. Check the scenario data and refresh the page.
            </p>
          </div>
        </main>
      ) : null}

      {view === 'simulator' && allScenarios.length > 0 ? (
        <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]">
          <Sidebar
            scenarios={queue}
            catalogCount={allScenarios.length}
            selectedId={selectedId}
            onSelect={selectScenario}
            onShuffle={shuffleQueue}
            results={results}
          />
          <div className="min-h-0 border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
            <TicketPanel scenario={scenario} />
          </div>
          <div className="min-h-0 bg-[#f4f6f8]">
            <Workbench
              scenario={scenario}
              stepIndex={workbench.stepIndex}
              selectedOptionId={workbench.selectedOptionId}
              lastFeedback={workbench.lastFeedback}
              history={workbench.history}
              draft={workbench.draft}
              selectedMacro={workbench.selectedMacro}
              onDraft={(value) => patchWorkbench((current) => ({ ...current, draft: value }))}
              onSelectMacro={(value) => patchWorkbench((current) => ({ ...current, selectedMacro: value }))}
              onChoose={chooseOption}
              onContinue={continueStep}
              onSubmit={submit}
              onReset={() => {
                if (!selectedId) return
                patchWorkbench({ ...emptyWorkbench })
                setReview(null)
              }}
              canSubmit={canSubmit}
            />
          </div>
        </main>
      ) : null}

      {review && scenario && view === 'simulator' && (
        <ReviewModal
          result={review}
          scenario={scenario}
          onRevise={() => setReview(null)}
          onClose={() => setReview(null)}
        />
      )}

      {confirmReset && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={() => setConfirmReset(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            className="my-6 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-pop sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Reset simulator</p>
            <h2 id="reset-title" className="mt-1 text-xl font-semibold text-slate-900">
              Wipe all answered scenarios?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              This clears every saved answer, draft, and grade from this browser, then draws a new set of{' '}
              {QUEUE_SIZE} tickets. This cannot be undone.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Keep progress
              </button>
              <button
                type="button"
                onClick={resetSimulator}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
              >
                <Trash2 size={16} />
                Reset simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
