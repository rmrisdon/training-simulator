export const STORAGE_KEY = 'ts-escalation-simulator'
export const QUEUE_SIZE = 5

export const emptyWorkbench = {
  stepIndex: 0,
  selectedOptionId: null,
  lastFeedback: null,
  history: [],
  draft: '',
  selectedMacro: '',
}

export function shuffleIds(ids, count = QUEUE_SIZE) {
  const copy = [...ids]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(count, copy.length))
}

export function resolveQueue(allIds, storedIds, count = QUEUE_SIZE) {
  const valid = new Set(allIds)
  const kept = (storedIds ?? []).filter((id) => valid.has(id))
  if (kept.length >= count) return kept.slice(0, count)
  const fill = shuffleIds(
    allIds.filter((id) => !kept.includes(id)),
    count - kept.length,
  )
  return [...kept, ...fill]
}

export function sanitizeWorkbench(value) {
  if (!value || typeof value !== 'object') return emptyWorkbench
  return {
    stepIndex: Number.isInteger(value.stepIndex) ? value.stepIndex : 0,
    selectedOptionId: value.selectedOptionId ?? null,
    lastFeedback: value.lastFeedback ?? null,
    history: Array.isArray(value.history) ? value.history : [],
    draft: typeof value.draft === 'string' ? value.draft : '',
    selectedMacro: typeof value.selectedMacro === 'string' ? value.selectedMacro : '',
  }
}

export function readPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return {
      queueIds: Array.isArray(data.queueIds) ? data.queueIds.filter((id) => typeof id === 'string') : [],
      selectedId: typeof data.selectedId === 'string' ? data.selectedId : null,
      results: data.results && typeof data.results === 'object' ? data.results : {},
      workbenches: data.workbenches && typeof data.workbenches === 'object' ? data.workbenches : {},
    }
  } catch {
    return null
  }
}

export function writePersisted(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        queueIds: state.queueIds,
        selectedId: state.selectedId,
        results: state.results,
        workbenches: state.workbenches,
      }),
    )
  } catch {
    // Private mode or quota — progress stays in memory for this session only.
  }
}

export function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage failures; in-memory reset still applies.
  }
}
