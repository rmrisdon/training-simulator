export const STORAGE_KEY = 'ts-escalation-simulator'

export const emptyWorkbench = {
  stepIndex: 0,
  selectedOptionId: null,
  lastFeedback: null,
  history: [],
  draft: '',
  selectedMacro: '',
}

export function pickRandomId(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return null
  return ids[Math.floor(Math.random() * ids.length)]
}

export function pickNextTicket(allIds, excludeIds = [], reviewedIds = []) {
  const preferredExclude = (excludeIds ?? []).filter(Boolean)
  const excluded = new Set(preferredExclude)
  const reviewed = new Set(reviewedIds ?? [])
  const available = allIds.filter((id) => !excluded.has(id))
  const currentId = preferredExclude[0]
  const pool = available.length > 0 ? available : allIds.filter((id) => id !== currentId)
  if (pool.length === 0) return null
  const unread = pool.filter((id) => !reviewed.has(id))
  return pickRandomId(unread.length > 0 ? unread : pool)
}

export function resolveSessionPair(allIds, stored) {
  const valid = new Set(allIds)
  const queue = (stored?.queueIds ?? []).filter((id) => valid.has(id))
  let selectedId = valid.has(stored?.selectedId) ? stored.selectedId : null
  let onDeckId = valid.has(stored?.onDeckId) ? stored.onDeckId : null

  if (!selectedId) selectedId = queue[0] ?? pickRandomId(allIds)
  if (!onDeckId || onDeckId === selectedId) {
    onDeckId = queue.find((id) => id !== selectedId) ?? pickNextTicket(allIds, [selectedId])
  }

  return { selectedId: selectedId ?? null, onDeckId: onDeckId ?? null }
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
      onDeckId: typeof data.onDeckId === 'string' ? data.onDeckId : null,
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
        version: 2,
        selectedId: state.selectedId,
        onDeckId: state.onDeckId,
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
