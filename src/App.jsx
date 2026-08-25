import { useMemo, useState } from 'react'
import { Database, Headset } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import TicketPanel from './components/TicketPanel.jsx'
import Workbench from './components/Workbench.jsx'
import ReviewModal from './components/ReviewModal.jsx'
import { loadScenarios } from './data/scenarios.js'
import { scoreSubmission } from './utils/scoring.js'

const emptyWorkbench = {
  stepIndex: 0,
  selectedOptionId: null,
  lastFeedback: null,
  history: [],
  draft: '',
}

export default function App() {
  const [scenarios, setScenarios] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [workbench, setWorkbench] = useState(emptyWorkbench)
  const [review, setReview] = useState(null)
  const [results, setResults] = useState({})

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === selectedId) ?? null,
    [scenarios, selectedId],
  )

  function loadSamples() {
    const loaded = loadScenarios()
    setScenarios(loaded)
    setSelectedId(loaded[0]?.id ?? null)
    setWorkbench(emptyWorkbench)
    setReview(null)
  }

  function selectScenario(id) {
    setSelectedId(id)
    setWorkbench(emptyWorkbench)
    setReview(null)
  }

  function chooseOption(optionId) {
    if (!scenario || workbench.lastFeedback) return
    const step = scenario.diagnosticSteps[workbench.stepIndex]
    const option = step.options.find((item) => item.id === optionId)
    setWorkbench((current) => ({
      ...current,
      selectedOptionId: optionId,
      lastFeedback: option,
    }))
  }

  function continueStep() {
    if (!scenario || !workbench.lastFeedback) return
    const step = scenario.diagnosticSteps[workbench.stepIndex]
    const option = workbench.lastFeedback
    setWorkbench((current) => ({
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
    const result = scoreSubmission(scenario, workbench.history, workbench.draft)
    setReview(result)
    setResults((current) => ({ ...current, [scenario.id]: result }))
  }

  const diagnosticsComplete = Boolean(scenario) && workbench.history.length === scenario.diagnosticSteps.length
  const canSubmit = diagnosticsComplete && workbench.draft.trim().split(/\s+/).filter(Boolean).length >= 40

  return (
    <div className="flex h-screen min-h-0 flex-col text-slate-100">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-ink-900/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Headset size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">TechSmith training</p>
            <h1 className="text-lg font-semibold tracking-tight">Escalation & Diagnostics Simulator</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={loadSamples}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-teal-300"
        >
          <Database size={16} />
          Load Sample Scenarios
        </button>
      </header>

      {scenarios.length === 0 ? (
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-xl rounded-3xl border border-white/10 bg-ink-800/70 p-8 text-center shadow-panel">
            <h2 className="text-2xl font-semibold">Train on the tickets that bounce to Tier 2</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Work a real-world Camtasia, Snagit, Audiate, or Screencast.com case: read the customer record, choose
              diagnostic moves, then draft the reply. Submit for Review scores the correct diagnostic path (40),
              required keywords (30), and word count plus empathy (30).
            </p>
            <button
              type="button"
              onClick={loadSamples}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-teal-300"
            >
              <Database size={16} />
              Load Sample Scenarios
            </button>
          </div>
        </main>
      ) : (
        <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]">
          <Sidebar
            scenarios={scenarios}
            selectedId={selectedId}
            onSelect={selectScenario}
            category={category}
            difficulty={difficulty}
            onCategory={setCategory}
            onDifficulty={setDifficulty}
            results={results}
          />
          <div className="min-h-0 border-b border-white/10 lg:border-b-0 lg:border-r">
            <TicketPanel scenario={scenario} />
          </div>
          <div className="min-h-0">
            <Workbench
              scenario={scenario}
              stepIndex={workbench.stepIndex}
              selectedOptionId={workbench.selectedOptionId}
              lastFeedback={workbench.lastFeedback}
              history={workbench.history}
              draft={workbench.draft}
              onDraft={(value) => setWorkbench((current) => ({ ...current, draft: value }))}
              onChoose={chooseOption}
              onContinue={continueStep}
              onSubmit={submit}
              onReset={() => {
                setWorkbench(emptyWorkbench)
                setReview(null)
              }}
              canSubmit={canSubmit}
            />
          </div>
        </main>
      )}

      {review && scenario && (
        <ReviewModal
          result={review}
          scenario={scenario}
          onRevise={() => setReview(null)}
          onClose={() => setReview(null)}
        />
      )}
    </div>
  )
}
