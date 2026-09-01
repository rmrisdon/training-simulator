function clamp(value, max = 100) {
  return Math.max(0, Math.min(max, Math.round(value)))
}

function letterGrade(score) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export const RUBRIC_WEIGHTS = {
  diagnostic: 30,
  macros: 20,
  keywords: 25,
  writing: 25,
}

export const WRITING_RULES = {
  minWords: 40,
  maxWords: 250,
  wordPoints: 12,
  apologyPoints: 7,
  acknowledgmentPoints: 6,
  apologyExamples: ['sorry', 'apologize', 'apologise', 'regret'],
  acknowledgmentExamples: [
    'understand',
    'frustrating',
    'inconvenience',
    'I know this',
    'that sounds',
    'happy to help',
    'thank you for reaching out',
  ],
}

const APOLOGY_RE = /sorry|apologis|apologiz|\bregret\b/i
const ACKNOWLEDGMENT_RE =
  /\bunderstand\b|frustrat|inconvenien|i know (this|how|that)|that sounds|i can (see|imagine|appreciate)|happy to help|glad to help|thank you for (reaching|writing|contacting|getting in touch)|thanks for (reaching|writing|contacting|getting in touch)/i

function getCriteria(scenario) {
  return scenario.emailCriteria ?? scenario.scoring ?? {}
}

export function getRequiredKeywords(scenario) {
  const criteria = getCriteria(scenario)
  const explicit = scenario.requiredKeywords ?? criteria.requiredKeywords
  if (Array.isArray(explicit) && explicit.length > 0) return explicit
  return criteria.accuracyTerms ?? []
}

export function getExpectedMacros(scenario) {
  const spec = scenario.expectedMacros ?? {}
  if (Array.isArray(spec)) {
    return { correct: spec, acceptable: [], rationale: '' }
  }
  return {
    correct: Array.isArray(spec.correct) ? spec.correct : [],
    acceptable: Array.isArray(spec.acceptable) ? spec.acceptable : [],
    rationale: spec.rationale ?? '',
  }
}

export function normalizeMatchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function textHasKeyword(text, keyword) {
  const haystack = normalizeMatchText(text)
  const needle = normalizeMatchText(keyword)
  if (!needle) return false
  return haystack.includes(needle)
}

export function scoreDiagnosticPath(scenario, history) {
  const max = scenario.diagnosticSteps.reduce((sum, step) => {
    const best = Math.max(...step.options.map((option) => option.score))
    return sum + best
  }, 0)

  const earned = history.reduce((sum, entry) => {
    const step = scenario.diagnosticSteps.find((item) => item.id === entry.stepId)
    const option = step?.options.find((item) => item.id === entry.optionId)
    return sum + (option?.score ?? 0)
  }, 0)

  const ratio = max === 0 ? 0 : earned / max
  return { earned, max, ratio }
}

function scoreDiagnosticSteps(scenario, history) {
  const steps = scenario.diagnosticSteps ?? []
  const perStep = steps.length === 0 ? 0 : RUBRIC_WEIGHTS.diagnostic / steps.length
  const details = steps.map((step, index) => {
    const chosen = history.find((entry) => entry.stepId === step.id)
    const option = step.options.find((item) => item.id === chosen?.optionId)
    const optimal = step.options.find((item) => item.quality === 'optimal')
    const quality = option?.quality ?? 'skipped'
    const earned =
      quality === 'optimal' ? perStep : quality === 'acceptable' ? perStep / 2 : 0
    return {
      index: index + 1,
      prompt: step.prompt,
      quality,
      chosenLabel: option?.label ?? 'No selection',
      optimalLabel: optimal?.label ?? '',
      earned,
      max: perStep,
      missed: perStep - earned,
    }
  })

  const earned = details.reduce((sum, item) => sum + item.earned, 0)
  return {
    earned: clamp(earned, RUBRIC_WEIGHTS.diagnostic),
    max: RUBRIC_WEIGHTS.diagnostic,
    missed: clamp(RUBRIC_WEIGHTS.diagnostic - earned, RUBRIC_WEIGHTS.diagnostic),
    details,
  }
}

function scoreKeywords(scenario, reply) {
  const keywords = getRequiredKeywords(scenario)
  const hit = []
  const missedKeywords = []

  for (const keyword of keywords) {
    if (textHasKeyword(reply, keyword)) hit.push(keyword)
    else missedKeywords.push(keyword)
  }

  const ratio = keywords.length === 0 ? 1 : hit.length / keywords.length
  const earned = clamp(RUBRIC_WEIGHTS.keywords * ratio, RUBRIC_WEIGHTS.keywords)
  return {
    earned,
    max: RUBRIC_WEIGHTS.keywords,
    missed: RUBRIC_WEIGHTS.keywords - earned,
    hit,
    missedKeywords,
  }
}

export function detectEmpathy(reply) {
  const hasApology = APOLOGY_RE.test(reply)
  const hasAcknowledgment = ACKNOWLEDGMENT_RE.test(reply)
  return { hasApology, hasAcknowledgment }
}

function scoreWriting(reply) {
  const words = reply.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const { hasApology, hasAcknowledgment } = detectEmpathy(reply)
  const { minWords, maxWords, wordPoints: fullWordPoints, apologyPoints, acknowledgmentPoints } =
    WRITING_RULES

  let wordPoints = 0
  let wordNote = ''
  if (wordCount < minWords) {
    wordPoints = clamp((wordCount / minWords) * fullWordPoints, fullWordPoints)
    wordNote = `The draft is ${wordCount} words. Full length credit starts at ${minWords} words.`
  } else if (wordCount <= maxWords) {
    wordPoints = fullWordPoints
  } else {
    wordPoints = Math.max(8, fullWordPoints - 2)
    wordNote = `The draft is ${wordCount} words. A slightly tighter reply is easier for the customer to scan.`
  }

  let empathyPoints = 0
  const empathyMisses = []
  if (hasApology) empathyPoints += apologyPoints
  else {
    empathyMisses.push(
      `Add an apology (${WRITING_RULES.apologyExamples.slice(0, 3).join(', ')}).`,
    )
  }
  if (hasAcknowledgment) empathyPoints += acknowledgmentPoints
  else {
    empathyMisses.push(
      `Acknowledge the situation (${WRITING_RULES.acknowledgmentExamples.slice(0, 3).join(', ')}, or similar).`,
    )
  }

  const earned = clamp(wordPoints + empathyPoints, RUBRIC_WEIGHTS.writing)
  return {
    earned,
    max: RUBRIC_WEIGHTS.writing,
    missed: RUBRIC_WEIGHTS.writing - earned,
    wordCount,
    wordPoints,
    wordNote,
    empathyPoints,
    hasApology,
    hasAcknowledgment,
    hasSorry: hasApology,
    hasUnderstand: hasAcknowledgment,
    empathyMisses,
  }
}

function scoreMacros(scenario, selectedTitle) {
  const expected = getExpectedMacros(scenario)
  const selected = String(selectedTitle ?? '').trim()

  if (expected.correct.length === 0) {
    return {
      earned: selected ? RUBRIC_WEIGHTS.macros : 0,
      max: RUBRIC_WEIGHTS.macros,
      missed: selected ? 0 : RUBRIC_WEIGHTS.macros,
      quality: selected ? 'unscored' : 'skipped',
      selectedTitle: selected,
      correct: [],
      acceptable: [],
      rationale: '',
    }
  }

  let quality = 'missed'
  let earned = 0
  if (!selected) quality = 'skipped'
  else if (expected.correct.includes(selected)) {
    quality = 'optimal'
    earned = RUBRIC_WEIGHTS.macros
  } else if (expected.acceptable.includes(selected)) {
    quality = 'acceptable'
    earned = RUBRIC_WEIGHTS.macros / 2
  }

  return {
    earned,
    max: RUBRIC_WEIGHTS.macros,
    missed: RUBRIC_WEIGHTS.macros - earned,
    quality,
    selectedTitle: selected,
    correct: expected.correct,
    acceptable: expected.acceptable,
    rationale: expected.rationale,
  }
}

function buildFeedback(diagnostic, keywords, writing, macros) {
  const feedback = []

  for (const step of diagnostic.details) {
    if (step.quality === 'optimal') continue
    if (step.quality === 'skipped') {
      feedback.push(`Complete diagnostic step ${step.index}: ${step.prompt}`)
    } else if (step.quality === 'acceptable') {
      feedback.push(
        `Step ${step.index} was acceptable, not optimal. Prefer: ${step.optimalLabel}`,
      )
    } else {
      feedback.push(
        `Step ${step.index} was not the correct diagnostic move. The optimal choice was: ${step.optimalLabel}`,
      )
    }
  }

  if (macros.quality === 'skipped') {
    feedback.push('Tag the ticket with the Zendesk macro that matches this issue before sending.')
  } else if (macros.quality === 'missed' && macros.correct[0]) {
    feedback.push(`Wrong macro. Tag this ticket with: ${macros.correct[0]}.`)
    if (macros.rationale) feedback.push(macros.rationale)
  } else if (macros.quality === 'acceptable' && macros.correct[0]) {
    feedback.push(`That macro is acceptable. The best tag is: ${macros.correct[0]}.`)
    if (macros.rationale) feedback.push(macros.rationale)
  }

  if (keywords.missedKeywords.length > 0) {
    const sample = keywords.missedKeywords.slice(0, 5).join(', ')
    feedback.push(`Name these rubric keywords in the reply: ${sample}.`)
  }

  if (writing.wordNote) feedback.push(writing.wordNote)
  feedback.push(...writing.empathyMisses)

  if (feedback.length === 0) {
    feedback.push('Strong closeout: this reply could go on a live queue with only light editing.')
  }

  return feedback
}

export function scoreSubmission(scenario, history, reply, selectedMacro = '') {
  const diagnostic = scoreDiagnosticSteps(scenario, history)
  const macros = scoreMacros(scenario, selectedMacro)
  const keywords = scoreKeywords(scenario, reply)
  const writing = scoreWriting(reply)
  const overall = clamp(diagnostic.earned + macros.earned + keywords.earned + writing.earned)
  const missedPoints = clamp(100 - overall)

  return {
    overall,
    grade: letterGrade(overall),
    missedPoints,
    diagnostic,
    macros,
    keywords,
    writing,
    feedback: buildFeedback(diagnostic, keywords, writing, macros),
    breakdown: [
      {
        id: 'diagnostic',
        label: 'Correct diagnostic steps',
        earned: diagnostic.earned,
        max: RUBRIC_WEIGHTS.diagnostic,
        missed: diagnostic.missed,
      },
      {
        id: 'macros',
        label: 'Macro tagging',
        earned: macros.earned,
        max: RUBRIC_WEIGHTS.macros,
        missed: macros.missed,
      },
      {
        id: 'keywords',
        label: 'Required keywords',
        earned: keywords.earned,
        max: RUBRIC_WEIGHTS.keywords,
        missed: keywords.missed,
      },
      {
        id: 'writing',
        label: 'Word count & empathy',
        earned: writing.earned,
        max: RUBRIC_WEIGHTS.writing,
        missed: writing.missed,
      },
    ],
  }
}
