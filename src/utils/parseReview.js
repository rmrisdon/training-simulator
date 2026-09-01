const RUBRIC_ALIASES = [
  { id: 'diagnostic', label: 'Correct diagnostic steps', match: /diagnostic/i },
  { id: 'macros', label: 'Macro tagging', match: /macro/i },
  { id: 'keywords', label: 'Required keywords', match: /keyword/i },
  { id: 'writing', label: 'Word count & empathy', match: /word count|empathy/i },
]

const GENERIC_EXPORT_NAME = /^escalation-review-\d{4}-\d{2}-\d{2}/i

function normalize(text) {
  return String(text ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

function trimCell(value) {
  return String(value ?? '')
    .replace(/\\\|/g, '|')
    .replace(/\s+/g, ' ')
    .trim()
}

function headingText(line) {
  return String(line ?? '')
    .replace(/^#{1,6}\s+/, '')
    .trim()
}

function inferAgentFromFilename(filename) {
  const base = String(filename || '')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/\.md$/i, '')
    .trim()
  if (!base || GENERIC_EXPORT_NAME.test(base)) return ''
  return base
    .replace(/^review[-_ ]+/i, '')
    .replace(/[-_ ]+review$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

function matchField(block, labels) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  // Exports use **Label:** value (colon inside bold), not **Label**: value.
  const pattern = new RegExp(`\\*\\*(?:${escaped.join('|')}):\\*\\*\\s*(.+?)\\s*$`, 'im')
  const hit = block.match(pattern)
  if (!hit) return ''
  const value = hit[1].replace(/\s{2,}$/, '').trim()
  if (!value || /^(not recorded|unknown|—|-)$/i.test(value)) return ''
  return value
}

function extractSection(block, title) {
  const lines = String(block ?? '').split('\n')
  const heading = new RegExp(`^###\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')
  const start = lines.findIndex((line) => heading.test(line))
  if (start === -1) return ''
  const out = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^###\s+/.test(line) || /^---\s*$/.test(line)) break
    out.push(line)
  }
  return out.join('\n').trim()
}

function parseBulletList(section) {
  if (!section) return []
  return section
    .split('\n')
    .map((line) => line.match(/^\s*[-*]\s+(.+)/)?.[1]?.trim())
    .filter(Boolean)
}

function parseRubric(section) {
  const rubric = {}
  for (const line of section.split('\n')) {
    const row = line.match(/^\|\s*(.+?)\s*\|\s*(\d+)\s*\/\s*(\d+)\s*\|\s*(\d+)\s*\|/)
    if (!row) continue
    const area = trimCell(row[1])
    if (/^area$/i.test(area) || /^---/.test(area)) continue
    const alias = RUBRIC_ALIASES.find((item) => item.match.test(area))
    if (!alias) continue
    const earned = Number(row[2])
    const max = Number(row[3])
    const missed = Number(row[4])
    rubric[alias.id] = { id: alias.id, label: alias.label, earned, max, missed }
  }
  return rubric
}

function parseDiagnosticSteps(section) {
  if (!section || /no diagnostic answers saved/i.test(section)) return []
  const chunks = section.split(/\*\*Step\s+(\d+)\.\*\*\s*/)
  const steps = []
  for (let index = 1; index < chunks.length; index += 2) {
    const number = Number(chunks[index])
    const body = chunks[index + 1] ?? ''
    const prompt = (body.split('\n')[0] ?? '').trim()
    const chosen = body.match(/-\s*Agent chose\s*\(([^)]+)\):\s*(.+)/i)
    const optimal = body.match(/-\s*Optimal:\s*(.+)/i)
    const quality = (chosen?.[1] ?? 'unknown').trim().toLowerCase()
    steps.push({
      index: Number.isFinite(number) ? number : steps.length + 1,
      prompt,
      quality,
      chosenLabel: chosen?.[2]?.trim() ?? '',
      optimalLabel: optimal?.[1]?.trim() ?? '',
    })
  }
  return steps
}

function parseMacro(section) {
  const lines = parseBulletList(section)
  const pick = (label) => {
    const row = lines.find((line) => line.toLowerCase().startsWith(label.toLowerCase()))
    if (!row) return ''
    return row.slice(row.indexOf(':') + 1).replace(/^\s*\*?/, '').replace(/\*$/, '').trim()
  }
  const selected = pick('Agent tagged')
  const quality = pick('Quality').toLowerCase()
  const expected = pick('Expected')
  return {
    selectedTitle: !selected || /^\*?\(none\)\*?$/i.test(selected) ? '' : selected,
    quality: quality || '—',
    expected: expected && expected !== '—' ? expected : '',
  }
}

function keywordsFromFeedback(feedback) {
  const found = []
  for (const item of feedback) {
    const hit = item.match(/Name these rubric keywords in the reply:\s*(.+)/i)
    if (!hit) continue
    const parts = hit[1]
      .replace(/[.]+$/, '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    found.push(...parts)
  }
  return [...new Set(found)]
}

function parseGradeLine(block) {
  const hit = block.match(/\*\*Grade:\*\*\s*([A-F][+-]?)\s*[·•.]\s*(\d+)\s*\/\s*100/i)
  if (!hit) return { grade: '', overall: null }
  return { grade: hit[1].toUpperCase(), overall: Number(hit[2]) }
}

function parseProductLine(block) {
  const raw = matchField(block, ['Product'])
  if (!raw) return { product: '', difficulty: '', category: '' }
  const parts = raw.split(/\s*·\s*/).map((part) => part.trim()).filter(Boolean)
  return {
    product: parts[0] ?? '',
    difficulty: parts[1] ?? '',
    category: parts[2] ?? '',
  }
}

function parseTicketHeading(heading) {
  const line = headingText(heading)
  const hit = line.match(/^(?:\d+\.\s+)?(\S+)\s+[—–-]\s+(.+)$/)
  if (!hit) return { ticketId: '', title: line }
  return { ticketId: hit[1].trim(), title: hit[2].trim() }
}

function splitTicketBlocks(markdown) {
  const lines = markdown.split('\n')
  const blocks = []
  let current = null

  for (const line of lines) {
    if (/^##\s+\d+\.\s+/.test(line)) {
      if (current) blocks.push(current)
      current = { heading: line, body: [] }
      continue
    }
    if (current) current.body.push(line)
  }
  if (current) blocks.push(current)
  return blocks
}

export function coachingForEvaluation(evaluation) {
  const recs = []
  const diagnostic = evaluation.rubric?.diagnostic
  const keywords = evaluation.rubric?.keywords
  const writing = evaluation.rubric?.writing
  const product = evaluation.product || 'product'

  if (diagnostic && diagnostic.earned < diagnostic.max) {
    recs.push({
      type: 'diagnostic',
      title: `${product} technical product lab`,
      detail: `Diagnostic steps earned ${diagnostic.earned}/${diagnostic.max}. Review the ${product} lab covering the missed path.`,
    })
  }
  if (keywords && keywords.earned < keywords.max) {
    recs.push({
      type: 'keywords',
      title: 'Macro & Knowledge Base reference review',
      detail: `Required keywords earned ${keywords.earned}/${keywords.max}. Revisit the article and macro language for this intent.`,
    })
  }
  if (writing && writing.earned < writing.max) {
    recs.push({
      type: 'empathy',
      title: 'De-escalation template review',
      detail: `Word count & empathy earned ${writing.earned}/${writing.max}. Practice apology, acknowledgment, and a scannable close.`,
    })
  }
  return recs
}

function parseTicketBlock(heading, body, fileMeta) {
  const block = `${heading}\n${body}`
  const { ticketId, title } = parseTicketHeading(heading)
  const { grade, overall } = parseGradeLine(block)
  const productLine = parseProductLine(block)
  const diagnosticSteps = parseDiagnosticSteps(extractSection(block, 'Diagnostic answers'))
  const missedDiagnosticSteps = diagnosticSteps.filter((step) => step.quality !== 'optimal')
  const feedback = parseBulletList(extractSection(block, 'Feedback'))
  const missedKeywords = keywordsFromFeedback(feedback)
  const rubric = parseRubric(extractSection(block, 'Rubric'))
  const agentName =
    matchField(block, ['Agent / User', 'Agent name', 'Reviewed agent', 'Agent', 'User']) ||
    fileMeta.agentName

  const evaluation = {
    id: `${fileMeta.filename}::${ticketId || title}::${fileMeta.index}`,
    sourceFile: fileMeta.filename,
    agentName: agentName || 'Unknown agent',
    ticketId,
    title,
    grade: grade || '—',
    overall: Number.isFinite(overall) ? overall : 0,
    product: productLine.product,
    difficulty: productLine.difficulty,
    category: productLine.category,
    intent: matchField(block, ['Intent']),
    customer: matchField(block, ['Customer']),
    submittedAt: matchField(block, ['Submitted']),
    exportedAt: fileMeta.exportedAt,
    macro: parseMacro(extractSection(block, 'Macro tag')),
    diagnosticSteps,
    missedDiagnosticSteps,
    missedKeywords,
    rubric,
    feedback,
    reply: extractSection(block, 'Customer reply')
      .replace(/^>/gm, '')
      .replace(/\n>/g, '\n')
      .trim(),
  }
  evaluation.coaching = coachingForEvaluation(evaluation)
  evaluation.passed = evaluation.overall >= 70
  return evaluation
}

export function parseReviewMarkdown(markdown, filename = '') {
  const text = normalize(markdown)
  const filenameAgent = inferAgentFromFilename(filename)
  const header = text.split(/^##\s+\d+\.\s+/m)[0] ?? text
  const headerAgent = matchField(header, ['Agent / User', 'Agent name', 'Reviewed agent', 'Agent', 'User'])
  const exportedAt = matchField(header, ['Exported']) || (header.match(/^Exported:\s*(.+)$/m)?.[1]?.trim() ?? '')
  const fileMeta = {
    filename: filename || 'pasted.md',
    agentName: headerAgent || filenameAgent,
    exportedAt,
  }

  const blocks = splitTicketBlocks(text)
  if (blocks.length === 0) {
    return {
      filename: fileMeta.filename,
      exportedAt,
      agentName: fileMeta.agentName,
      evaluations: [],
      error: 'No ticket reviews found in this Markdown file.',
    }
  }

  const evaluations = blocks.map((block, index) =>
    parseTicketBlock(block.heading, block.body.join('\n'), { ...fileMeta, index }),
  )

  return {
    filename: fileMeta.filename,
    exportedAt,
    agentName: fileMeta.agentName,
    evaluations,
    error: null,
  }
}

function gapKey(kind, label) {
  return `${kind}::${label.trim().toLowerCase()}`
}

export function summarizeEvaluations(evaluations) {
  const total = evaluations.length
  const avgScore = total === 0 ? 0 : Math.round(evaluations.reduce((sum, item) => sum + item.overall, 0) / total)
  const passed = evaluations.filter((item) => item.overall >= 70).length
  const passRate = total === 0 ? 0 : Math.round((passed / total) * 100)

  const gaps = new Map()
  function bump(kind, label) {
    const text = String(label ?? '').trim()
    if (!text) return
    const key = gapKey(kind, text)
    const prev = gaps.get(key) ?? { kind, label: text, count: 0 }
    prev.count += 1
    gaps.set(key, prev)
  }

  const coachingGroups = {
    diagnostic: new Map(),
    keywords: { count: 0, tickets: [] },
    empathy: { count: 0, tickets: [] },
  }

  for (const item of evaluations) {
    for (const step of item.missedDiagnosticSteps) {
      bump('diagnostic', step.optimalLabel || step.prompt)
    }
    for (const keyword of item.missedKeywords) bump('keyword', keyword)

    for (const rec of item.coaching) {
      if (rec.type === 'diagnostic') {
        const product = item.product || 'Product'
        const prev = coachingGroups.diagnostic.get(product) ?? { product, count: 0, tickets: [] }
        prev.count += 1
        prev.tickets.push(item.ticketId || item.title)
        coachingGroups.diagnostic.set(product, prev)
      } else if (rec.type === 'keywords') {
        coachingGroups.keywords.count += 1
        coachingGroups.keywords.tickets.push(item.ticketId || item.title)
      } else if (rec.type === 'empathy') {
        coachingGroups.empathy.count += 1
        coachingGroups.empathy.tickets.push(item.ticketId || item.title)
      }
    }
  }

  const recommendations = []
  for (const group of coachingGroups.diagnostic.values()) {
    recommendations.push({
      type: 'diagnostic',
      title: `Review the ${group.product} technical product lab`,
      detail: `${group.count} attempt${group.count === 1 ? '' : 's'} missed full diagnostic credit.`,
      count: group.count,
    })
  }
  if (coachingGroups.keywords.count > 0) {
    recommendations.push({
      type: 'keywords',
      title: 'Review Macro & Knowledge Base references',
      detail: `${coachingGroups.keywords.count} attempt${coachingGroups.keywords.count === 1 ? '' : 's'} missed required keywords.`,
      count: coachingGroups.keywords.count,
    })
  }
  if (coachingGroups.empathy.count > 0) {
    recommendations.push({
      type: 'empathy',
      title: 'Review de-escalation templates',
      detail: `${coachingGroups.empathy.count} attempt${coachingGroups.empathy.count === 1 ? '' : 's'} missed word count & empathy credit.`,
      count: coachingGroups.empathy.count,
    })
  }
  recommendations.sort((a, b) => b.count - a.count)

  return {
    total,
    avgScore,
    passed,
    passRate,
    topGaps: [...gaps.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 10),
    recommendations,
  }
}
