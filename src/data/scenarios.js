import catalog from './scenarios.json' with { type: 'json' }
import { buildMacroChoices, loadMacros, normalizeExpectedMacros, shuffleWithSeed } from './macros.js'

export const CATEGORIES = catalog.categories
export const DIFFICULTIES = catalog.difficulties

function shuffleDiagnosticSteps(scenario) {
  return (scenario.diagnosticSteps ?? []).map((step) => ({
    ...step,
    options: shuffleWithSeed(step.options ?? [], `${scenario.id}:${step.id}:options`),
  }))
}

export function loadScenarios() {
  const macros = loadMacros()
  return catalog.scenarios.map((scenario) => {
    const criteria = scenario.emailCriteria ?? {}
    const requiredKeywords = scenario.requiredKeywords ?? criteria.requiredKeywords ?? criteria.accuracyTerms ?? []
    const diagnosticSteps = shuffleDiagnosticSteps(scenario)
    const normalized = {
      ...scenario,
      diagnosticSteps,
      requiredKeywords,
      expectedMacros: normalizeExpectedMacros(scenario.expectedMacros),
      emailCriteria: {
        ...criteria,
        requiredKeywords,
      },
    }
    return {
      ...normalized,
      macroChoices: buildMacroChoices(normalized, macros),
    }
  })
}
