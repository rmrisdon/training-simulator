export const PASTE_WORD_THRESHOLD = 25

export function countWords(text) {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function isSuspectedPaste(largestPasteWords, draft) {
  return (largestPasteWords ?? 0) >= PASTE_WORD_THRESHOLD && countWords(draft) >= PASTE_WORD_THRESHOLD
}
