import { highlightSegments } from '@/utils/highlight'
import { describe, expect, it } from 'vitest'

describe('highlightSegments', () => {
  it('marks case- and accent-insensitive matches keeping the original text', () => {
    expect(highlightSegments('Meu Projéto Novo', 'projeto')).toEqual([
      { text: 'Meu ', match: false },
      { text: 'Projéto', match: true },
      { text: ' Novo', match: false },
    ])
    expect(highlightSegments('Ação', 'ACAO')).toEqual([{ text: 'Ação', match: true }])
  })

  it('folds accents in the term too', () => {
    expect(highlightSegments('Projeto', 'projéto')).toEqual([{ text: 'Projeto', match: true }])
  })

  it('marks every occurrence', () => {
    expect(highlightSegments('ana e Ana e ANA', 'ana')).toEqual([
      { text: 'ana', match: true },
      { text: ' e ', match: false },
      { text: 'Ana', match: true },
      { text: ' e ', match: false },
      { text: 'ANA', match: true },
    ])
  })

  it('keeps decomposed accents inside the match', () => {
    const text = 'Projéto X'

    expect(highlightSegments(text, 'projeto')).toEqual([
      { text: 'Projéto', match: true },
      { text: ' X', match: false },
    ])
  })

  it('returns a single non-match segment when nothing matches', () => {
    expect(highlightSegments('Alfa', 'beta')).toEqual([{ text: 'Alfa', match: false }])
  })

  it.each(['', '   '])('returns a single non-match segment for the term %j', (term) => {
    expect(highlightSegments('Alfa', term)).toEqual([{ text: 'Alfa', match: false }])
  })

  it('joins back to the original text', () => {
    const text = 'Gestão de Projétos e projetos'

    expect(
      highlightSegments(text, 'PROJETOS')
        .map((segment) => segment.text)
        .join(''),
    ).toBe(text)
  })
})
