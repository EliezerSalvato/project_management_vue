export type HighlightSegment = {
  text: string
  match: boolean
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function foldWithOrigins(text: string): { folded: string; origins: number[] } {
  let folded = ''
  const origins: number[] = []

  for (let index = 0; index < text.length; index++) {
    const piece = fold(text[index]!)
    folded += piece

    for (let count = 0; count < piece.length; count++) origins.push(index)
  }

  return { folded, origins }
}

export function highlightSegments(text: string, term: string): HighlightSegment[] {
  const foldedTerm = fold(term.trim())
  if (foldedTerm === '') return [{ text, match: false }]

  const { folded, origins } = foldWithOrigins(text)
  const segments: HighlightSegment[] = []
  let cursor = 0
  let position = folded.indexOf(foldedTerm)

  while (position !== -1) {
    const start = origins[position]!
    let end = origins[position + foldedTerm.length - 1]! + 1

    while (end < text.length && fold(text[end]!) === '') end++

    if (start > cursor) segments.push({ text: text.slice(cursor, start), match: false })

    segments.push({ text: text.slice(start, end), match: true })
    cursor = end
    position = folded.indexOf(foldedTerm, position + foldedTerm.length)
  }

  if (cursor < text.length || segments.length === 0) {
    segments.push({ text: text.slice(cursor), match: false })
  }

  return segments
}
