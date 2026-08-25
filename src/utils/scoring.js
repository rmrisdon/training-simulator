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

function getCriteria(scenario) {
  return scenario.emailCriteria ?? scenario.scoring ?? {}
}

export function getRequiredKeywords(scenario) {
  const criteria = getCriteria(scenario)
  const explicit = scenario.requiredKeywords ?? criteria.requiredKeywords
  if (Array.isArray(explicit) && explicit.length > 0) return explicit
  return criteria.accuracyTerms ?? []
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
  const perStep = steps.length === 0 ? 0 : 40 / steps.length
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
    earned: clamp(earned, 40),
    max: 40,
    missed: clamp(40 - earned, 40),
    details,
  }
}

function scoreKeywords(scenario, reply) {
  const keywords = getRequiredKeywords(scenario)
  const text = reply.toLowerCase()
  const hit = []
  const missedKeywords = []

  for (const keyword of keywords) {
    if (text.includes(String(keyword).toLowerCase())) hit.push(keyword)
    else missedKeywords.push(keyword)
  }

  const ratio = keywords.length === 0 ? 1 : hit.length / keywords.length
  const earned = clamp(30 * ratio, 30)
  return {
    earned,
    max: 30,
    missed: 30 - earned,
    hit,
    missedKeywords,
  }
}

function scoreWriting(reply) {
  const words = reply.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const text = reply.toLowerCase()
  const hasSorry = /sorry|apolog/i.test(reply)
  const hasUnderstand = /\bunderstand\b/i.test(text)

  let wordPoints = 0
  let wordNote = ''
  if (wordCount < 40) {
    wordPoints = clamp((wordCount / 40) * 8, 15)
    wordNote = `The draft is ${wordCount} words. Aim for at least 80 words with numbered next steps.`
  } else if (wordCount < 60) {
    wordPoints = 8
    wordNote = `The draft is ${wordCount} words — add a bit more detail (target 80–220).`
  } else if (wordCount < 80) {
    wordPoints = 12
    wordNote = `The draft is ${wordCount} words — one more short paragraph of steps would earn full length credit.`
  } else if (wordCount <= 250) {
    wordPoints = 15
  } else {
    wordPoints = 10
    wordNote = `The draft is ${wordCount} words. Tighten it so the customer can scan the path.`
  }

  let empathyPoints = 0
  const empathyMisses = []
  if (hasSorry) empathyPoints += 8
  else empathyMisses.push('Add an apology or “I’m sorry” for the disruption.')
  if (hasUnderstand) empathyPoints += 7
  else empathyMisses.push('Acknowledge the situation with “I understand” (or similar).')

  const earned = clamp(wordPoints + empathyPoints, 30)
  return {
    earned,
    max: 30,
    missed: 30 - earned,
    wordCount,
    wordPoints,
    wordNote,
    empathyPoints,
    hasSorry,
    hasUnderstand,
    empathyMisses,
  }
}

function buildFeedback(diagnostic, keywords, writing) {
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

export function scoreSubmission(scenario, history, reply) {
  const diagnostic = scoreDiagnosticSteps(scenario, history)
  const keywords = scoreKeywords(scenario, reply)
  const writing = scoreWriting(reply)
  const overall = clamp(diagnostic.earned + keywords.earned + writing.earned)
  const missedPoints = clamp(100 - overall)

  return {
    overall,
    grade: letterGrade(overall),
    missedPoints,
    diagnostic,
    keywords,
    writing,
    feedback: buildFeedback(diagnostic, keywords, writing),
    breakdown: [
      {
        id: 'diagnostic',
        label: 'Correct diagnostic steps',
        earned: diagnostic.earned,
        max: 40,
        missed: diagnostic.missed,
      },
      {
        id: 'keywords',
        label: 'Required keywords',
        earned: keywords.earned,
        max: 30,
        missed: keywords.missed,
      },
      {
        id: 'writing',
        label: 'Word count & empathy',
        earned: writing.earned,
        max: 30,
        missed: writing.missed,
      },
    ],
  }
}
