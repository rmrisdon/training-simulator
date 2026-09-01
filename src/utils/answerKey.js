import { downloadTextFile } from './export.js'
import { getExpectedMacros, getRequiredKeywords, RUBRIC_WEIGHTS, WRITING_RULES } from './scoring.js'

function getCriteria(scenario) {
  return scenario.emailCriteria ?? scenario.scoring ?? {}
}

export function buildScenarioAnswerKey(scenario) {
  const criteria = getCriteria(scenario)
  const steps = scenario.diagnosticSteps ?? []
  return {
    id: scenario.id,
    ticketId: scenario.ticketId,
    title: scenario.title,
    product: scenario.product,
    category: scenario.category,
    difficulty: scenario.difficulty,
    intent: scenario.intent ?? '',
    intentSubcategory: scenario.intentSubcategory ?? '',
    summary: scenario.summary ?? '',
    sources: scenario.sources ?? [],
    diagnostic: steps.map((step, index) => {
      const optimal = step.options.find((option) => option.quality === 'optimal')
      const acceptable = step.options.filter((option) => option.quality === 'acceptable')
      return {
        index: index + 1,
        prompt: step.prompt,
        optimalLabel: optimal?.label ?? '',
        optimalFeedback: optimal?.feedback ?? '',
        acceptable: acceptable.map((option) => ({
          label: option.label,
          feedback: option.feedback ?? '',
        })),
      }
    }),
    macros: getExpectedMacros(scenario),
    keywords: getRequiredKeywords(scenario),
    tone: criteria.tone ?? '',
    requiredElements: Array.isArray(criteria.requiredElements) ? criteria.requiredElements : [],
    modelReplyHints: Array.isArray(criteria.modelReplyHints) ? criteria.modelReplyHints : [],
    incorrectTerms: Array.isArray(criteria.incorrectTerms) ? criteria.incorrectTerms : [],
  }
}

export function buildAnswerKeyCatalog(scenarios) {
  return (scenarios ?? []).map(buildScenarioAnswerKey)
}

function stampAnswerKeyFilename(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `escalation-answer-key-${year}-${month}-${day}.md`
}

function bulletList(items) {
  if (!items || items.length === 0) return '_None listed._'
  return items.map((item) => `- ${item}`).join('\n')
}

function renderScenarioMarkdown(entry) {
  const lines = [
    `## ${entry.ticketId} — ${entry.title}`,
    '',
    `**Product:** ${entry.product} · ${entry.difficulty} · ${entry.category}  `,
    `**Intent:** ${entry.intent || '—'}`,
    '',
    '### Ticket summary',
    '',
    entry.summary || '_No summary._',
    '',
    '### Optimal diagnostic path',
    '',
  ]

  for (const step of entry.diagnostic) {
    lines.push(`**Step ${step.index}.** ${step.prompt}`)
    lines.push(`- Optimal (full credit): ${step.optimalLabel || '—'}`)
    if (step.acceptable.length > 0) {
      for (const option of step.acceptable) {
        lines.push(`- Acceptable (half credit): ${option.label}`)
      }
    }
    lines.push('')
  }

  lines.push(
    '### Macro tagging',
    '',
    `- Correct: ${entry.macros.correct[0] || '—'}`,
  )
  if (entry.macros.correct.length > 1) {
    for (const title of entry.macros.correct.slice(1)) {
      lines.push(`- Also correct: ${title}`)
    }
  }
  if (entry.macros.acceptable.length > 0) {
    lines.push(`- Acceptable (half credit): ${entry.macros.acceptable.join('; ')}`)
  }
  if (entry.macros.rationale) {
    lines.push(`- Rationale: ${entry.macros.rationale}`)
  }

  lines.push(
    '',
    '### Required keywords (25 pts)',
    '',
    'These strings must appear in the customer reply (punctuation and capitalization do not matter):',
    '',
    bulletList(entry.keywords),
    '',
    '### Reply content',
    '',
  )

  if (entry.tone) lines.push(`- Tone: ${entry.tone}`)
  if (entry.requiredElements.length > 0) {
    lines.push('- Cover these points:')
    for (const item of entry.requiredElements) lines.push(`  - ${item}`)
  }
  if (entry.modelReplyHints.length > 0) {
    lines.push('- Model-reply hints:')
    for (const item of entry.modelReplyHints) lines.push(`  - ${item}`)
  }
  if (entry.incorrectTerms.length > 0) {
    lines.push(`- Do not use: ${entry.incorrectTerms.join('; ')}`)
  }

  if (entry.sources.length > 0) {
    lines.push('', '### Official sources', '')
    for (const source of entry.sources) {
      const title = source.title || source.url
      lines.push(source.url ? `- [${title}](${source.url})` : `- ${title}`)
    }
  }

  return lines.join('\n').trim()
}

export function buildAnswerKeyMarkdown(scenarios, exportedAt = new Date()) {
  const entries = buildAnswerKeyCatalog(scenarios)
  const { minWords, maxWords, wordPoints, apologyPoints, acknowledgmentPoints, apologyExamples, acknowledgmentExamples } =
    WRITING_RULES

  const lines = [
    '# Escalation Simulator — Answer Key',
    '',
    `Generated: ${exportedAt.toLocaleString()}  `,
    `Scenarios: ${entries.length}`,
    '',
    '## How grading works',
    '',
    'Every ticket is scored out of 100:',
    '',
    `| Area | Points | What earns credit |`,
    `| --- | --- | --- |`,
    `| Correct diagnostic steps | ${RUBRIC_WEIGHTS.diagnostic} | Optimal choice on each step (acceptable = half) |`,
    `| Macro tagging | ${RUBRIC_WEIGHTS.macros} | The listed correct macro (acceptable = half) |`,
    `| Required keywords | ${RUBRIC_WEIGHTS.keywords} | Name each keyword in the customer reply |`,
    `| Word count & empathy | ${RUBRIC_WEIGHTS.writing} | ${wordPoints} pts for ${minWords}–${maxWords} words; ${apologyPoints} pts apology; ${acknowledgmentPoints} pts acknowledgment |`,
    '',
    `**Writing — length:** full credit at ${minWords}–${maxWords} words.`,
    '',
    `**Writing — apology (${apologyPoints} pts):** ${apologyExamples.join(', ')}.`,
    '',
    `**Writing — acknowledgment (${acknowledgmentPoints} pts):** ${acknowledgmentExamples.join(', ')}, or similar phrasing.`,
    '',
    'Pass mark for coaching dashboards is 70/100.',
    '',
    '---',
    '',
  ]

  entries.forEach((entry, index) => {
    lines.push(renderScenarioMarkdown(entry), '', index < entries.length - 1 ? '---' : '', '')
  })

  return lines.join('\n').trim() + '\n'
}

export function downloadAnswerKey(scenarios, date = new Date()) {
  downloadTextFile(buildAnswerKeyMarkdown(scenarios, date), stampAnswerKeyFilename(date))
}

export { stampAnswerKeyFilename }
