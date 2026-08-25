import catalog from './scenarios.json'

export const CATEGORIES = catalog.categories
export const DIFFICULTIES = catalog.difficulties

export function loadScenarios() {
  return catalog.scenarios.map((scenario) => {
    const criteria = scenario.emailCriteria ?? {}
    const requiredKeywords = scenario.requiredKeywords ?? criteria.requiredKeywords ?? criteria.accuracyTerms ?? []
    return {
      ...scenario,
      requiredKeywords,
      emailCriteria: {
        ...criteria,
        requiredKeywords,
      },
    }
  })
}
