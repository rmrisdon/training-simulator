import catalog from './macros.json' with { type: 'json' }

function hashString(value) {
  let hash = 2166136261
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed) {
  let a = seed
  return function random() {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled(list, random) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function familyPrefix(title) {
  const index = String(title).indexOf('::')
  return index === -1 ? String(title).trim() : String(title).slice(0, index).trim()
}

export function loadMacros() {
  return catalog
}

export function getMacroByTitle(title) {
  if (!title) return null
  return catalog.find((item) => item.title === title) ?? null
}

export function searchMacros(query, list = catalog) {
  const tokens = String(query ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) return list
  return list.filter((macro) => {
    const haystack = [
      macro.title,
      macro.category,
      macro.subcategory,
      macro.detail,
      macro.description,
      macro.whenToUse,
      macro.tags,
    ]
      .join(' ')
      .toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}

export function normalizeExpectedMacros(raw) {
  if (Array.isArray(raw) && raw.length > 0) {
    return { correct: raw, acceptable: [], rationale: '' }
  }
  if (raw && typeof raw === 'object') {
    const correct = Array.isArray(raw.correct) ? raw.correct : []
    const acceptable = Array.isArray(raw.acceptable) ? raw.acceptable : []
    return {
      correct,
      acceptable,
      rationale: raw.rationale ?? '',
    }
  }
  return { correct: [], acceptable: [], rationale: '' }
}

export function buildMacroChoices(scenario, macros = catalog, count = 4) {
  const expected = normalizeExpectedMacros(scenario?.expectedMacros)
  const byTitle = new Map(macros.map((item) => [item.title, item]))
  const primary = expected.correct.find((title) => byTitle.has(title))
  if (!primary) return []

  const random = mulberry32(hashString(scenario.id ?? primary))
  const selected = new Set([primary])
  const nearMiss = expected.acceptable.find((title) => byTitle.has(title) && title !== primary)
  if (nearMiss) selected.add(nearMiss)

  const pool = macros.map((item) => item.title).filter((title) => !selected.has(title))
  const prefix = familyPrefix(primary)
  const sameFamily = shuffled(
    pool.filter((title) => familyPrefix(title) === prefix),
    random,
  )
  const otherFamily = shuffled(
    pool.filter((title) => familyPrefix(title) !== prefix),
    random,
  )

  for (const title of [...sameFamily, ...otherFamily]) {
    if (selected.size >= count) break
    selected.add(title)
  }

  return shuffled([...selected], random)
    .map((title) => byTitle.get(title))
    .filter(Boolean)
    .slice(0, count)
}
