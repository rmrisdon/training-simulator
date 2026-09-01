function cell(value) {
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
    .trim()
}

function blockquote(text) {
  const body = String(text ?? '').trim()
  if (!body) return '> *(none)*'
  return body
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')
}

function stampFilename(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `escalation-review-${year}-${month}-${day}.md`
}

function collectEntries(allScenarios, results, workbenches = {}) {
  const byId = new Map(allScenarios.map((item) => [item.id, item]))
  return Object.entries(results)
    .map(([id, result]) => ({
      id,
      scenario: byId.get(id) ?? null,
      result,
      workbench: workbenches[id] ?? null,
    }))
    .filter((entry) => entry.scenario && entry.result)
}

function replyText(entry) {
  if (typeof entry.result.reply === 'string' && entry.result.reply.trim()) return entry.result.reply
  if (typeof entry.workbench?.draft === 'string' && entry.workbench.draft.trim()) return entry.workbench.draft
  return ''
}

function renderDiagnostic(result, scenario) {
  const details = result.diagnostic?.details
  if (Array.isArray(details) && details.length > 0) {
    return details
      .map((step) => {
        const lines = [
          `**Step ${step.index}.** ${step.prompt}`,
          `- Agent chose (${step.quality}): ${step.chosenLabel}`,
        ]
        if (step.quality !== 'optimal' && step.optimalLabel) {
          lines.push(`- Optimal: ${step.optimalLabel}`)
        }
        return lines.join('\n')
      })
      .join('\n\n')
  }

  const history = result.history ?? []
  if (history.length === 0) return '_No diagnostic answers saved._'

  return history
    .map((entry, index) => {
      const step = scenario.diagnosticSteps?.find((item) => item.id === entry.stepId)
      const prompt = step?.prompt ?? entry.stepId
      return `**Step ${index + 1}.** ${prompt}\n- Agent chose (${entry.quality}): ${entry.label}`
    })
    .join('\n\n')
}

function renderTicket(entry, index) {
  const { scenario, result } = entry
  const reply = replyText(entry)
  const macro = result.macros ?? {}
  const breakdown = Array.isArray(result.breakdown) ? result.breakdown : []
  const feedback = Array.isArray(result.feedback) ? result.feedback : []
  const submitted = result.submittedAt
    ? new Date(result.submittedAt).toLocaleString()
    : 'not recorded'

  const parts = [
    `## ${index + 1}. ${scenario.ticketId} — ${scenario.title}`,
    '',
    `**Grade:** ${result.grade} · ${result.overall}/100  `,
    ...(result.agentName ? [`**Agent:** ${result.agentName}  `] : []),
    `**Product:** ${scenario.product} · ${scenario.difficulty} · ${scenario.category}  `,
    `**Intent:** ${scenario.intent ?? '—'}  `,
    `**Customer:** ${scenario.customer?.name ?? '—'} (${scenario.customer?.company ?? '—'})  `,
    `**Submitted:** ${submitted}`,
    '',
    '### Ticket',
    '',
    blockquote(scenario.summary || scenario.description),
    '',
    '### Issue description',
    '',
    blockquote(scenario.description),
    '',
    '### Diagnostic answers',
    '',
    renderDiagnostic(result, scenario),
    '',
    '### Macro tag',
    '',
    `- Agent tagged: ${macro.selectedTitle || '*(none)*'}`,
    `- Quality: ${macro.quality ?? '—'}`,
  ]

  if (macro.correct?.[0]) {
    parts.push(`- Expected: ${macro.correct[0]}`)
  }

  parts.push(
    '',
    '### Customer reply',
    '',
    reply ? blockquote(reply) : '_No reply saved for this ticket._',
    '',
    '### Rubric',
    '',
  )

  if (breakdown.length > 0) {
    parts.push('| Area | Score | Missed |', '| --- | --- | --- |')
    for (const item of breakdown) {
      parts.push(`| ${cell(item.label)} | ${item.earned}/${item.max} | ${item.missed} |`)
    }
  } else {
    parts.push('_No rubric breakdown saved._')
  }

  if (feedback.length > 0) {
    parts.push('', '### Feedback', '')
    for (const item of feedback) parts.push(`- ${item}`)
  }

  return parts.join('\n')
}

export function buildReviewMarkdown(allScenarios, results, workbenches = {}, exportedAt = new Date()) {
  const entries = collectEntries(allScenarios, results, workbenches)
  if (entries.length === 0) {
    return [
      '# Escalation Simulator — Review Export',
      '',
      `Exported: ${exportedAt.toLocaleString()}`,
      '',
      'No submitted tickets to export.',
      '',
    ].join('\n')
  }

  const avg = Math.round(entries.reduce((sum, entry) => sum + (entry.result.overall ?? 0), 0) / entries.length)

  const lines = [
    '# Escalation Simulator — Review Export',
    '',
    `Exported: ${exportedAt.toLocaleString()}  `,
    `Tickets reviewed: ${entries.length}  `,
    `Average score: ${avg}/100`,
    '',
    '## Summary',
    '',
    '| Ticket | Title | Grade | Score | Macro |',
    '| --- | --- | --- | --- | --- |',
  ]

  for (const entry of entries) {
    const macro = entry.result.macros?.selectedTitle || '—'
    lines.push(
      `| ${cell(entry.scenario.ticketId)} | ${cell(entry.scenario.title)} | ${cell(entry.result.grade)} | ${entry.result.overall}/100 | ${cell(macro)} |`,
    )
  }

  lines.push('')

  entries.forEach((entry, index) => {
    lines.push(renderTicket(entry, index), '', '---', '')
  })

  return lines.join('\n').trim() + '\n'
}

export function downloadTextFile(contents, filename, mime = 'text/markdown;charset=utf-8') {
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadReviewMarkdown(markdown, date = new Date()) {
  downloadTextFile(markdown, stampFilename(date))
}

export { stampFilename, collectEntries }
