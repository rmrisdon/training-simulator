import catalog from './scenarios.json' with { type: 'json' }
import { buildMacroChoices, loadMacros, normalizeExpectedMacros } from './macros.js'

export const CATEGORIES = catalog.categories
export const DIFFICULTIES = catalog.difficulties

export function loadScenarios() {
  const macros = loadMacros()
  return catalog.scenarios.map((scenario) => {
    const criteria = scenario.emailCriteria ?? {}
    const requiredKeywords = scenario.requiredKeywords ?? criteria.requiredKeywords ?? criteria.accuracyTerms ?? []
    const normalized = {
      ...scenario,
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
