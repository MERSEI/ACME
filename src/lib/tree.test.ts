import { describe, it, expect } from 'vitest'
import type { Entry } from './types'
import {
  buildBreadcrumbs,
  collectDescendants,
  entryPath,
  siblingNames,
  sortEntries,
  uniqueName,
} from './tree'
import { validateName } from './validation'

function entry(partial: Partial<Entry> & Pick<Entry, 'id' | 'name'>): Entry {
  return {
    roomId: 'room-1',
    parentId: null,
    type: 'folder',
    createdAt: 0,
    updatedAt: 0,
    ...partial,
  }
}

const tree: Entry[] = [
  entry({ id: 'legal', name: 'Legal' }),
  entry({ id: 'contracts', name: 'Contracts', parentId: 'legal' }),
  entry({ id: 'msa', name: 'MSA.pdf', parentId: 'contracts', type: 'file' }),
  entry({ id: 'hr', name: 'HR' }),
  entry({ id: 'report', name: 'report.pdf', type: 'file' }),
]

describe('uniqueName', () => {
  const taken = new Set(['report.pdf', 'report (1).pdf', 'notes'])

  it('keeps a free name untouched', () => {
    expect(uniqueName('summary.pdf', taken)).toBe('summary.pdf')
  })

  it('appends a counter before the extension', () => {
    expect(uniqueName('report.pdf', taken)).toBe('report (2).pdf')
  })

  it('handles names without extension (folders)', () => {
    expect(uniqueName('notes', taken)).toBe('notes (1)')
  })

  it('is case-insensitive like real file systems', () => {
    expect(uniqueName('REPORT.PDF', taken)).toBe('REPORT (2).PDF')
  })

  it('does not treat a leading dot as an extension', () => {
    expect(uniqueName('.env', new Set(['.env']))).toBe('.env (1)')
  })
})

describe('collectDescendants', () => {
  it('returns the whole subtree, excluding the root', () => {
    const ids = collectDescendants(tree, 'legal').map((e) => e.id)
    expect(ids.sort()).toEqual(['contracts', 'msa'])
  })

  it('returns nothing for a leaf', () => {
    expect(collectDescendants(tree, 'report')).toEqual([])
  })
})

describe('buildBreadcrumbs', () => {
  it('walks from the root down to the folder', () => {
    expect(buildBreadcrumbs(tree, 'contracts').map((e) => e.name)).toEqual(['Legal', 'Contracts'])
  })

  it('survives a broken parent link', () => {
    const orphan = entry({ id: 'orphan', name: 'Orphan', parentId: 'ghost' })
    expect(buildBreadcrumbs([...tree, orphan], 'orphan').map((e) => e.id)).toEqual(['orphan'])
  })
})

describe('entryPath', () => {
  it('renders the folder path of a nested file', () => {
    const msa = tree.find((e) => e.id === 'msa')!
    expect(entryPath(tree, msa)).toBe('Legal / Contracts')
  })

  it('is empty at the room root', () => {
    const report = tree.find((e) => e.id === 'report')!
    expect(entryPath(tree, report)).toBe('')
  })
})

describe('sortEntries', () => {
  it('puts folders first, then natural name order', () => {
    const items = [
      entry({ id: '1', name: 'report 10.pdf', type: 'file' }),
      entry({ id: '2', name: 'report 2.pdf', type: 'file' }),
      entry({ id: '3', name: 'Archive' }),
    ]
    expect(sortEntries(items).map((e) => e.name)).toEqual(['Archive', 'report 2.pdf', 'report 10.pdf'])
  })
})

describe('validateName', () => {
  const siblings = siblingNames(tree, null)

  it('trims and accepts a valid name', () => {
    expect(validateName('  Board Minutes  ', siblings)).toEqual({ ok: true, name: 'Board Minutes' })
  })

  it('rejects empty and whitespace-only names', () => {
    expect(validateName('   ', siblings).ok).toBe(false)
  })

  it('rejects duplicates case-insensitively', () => {
    expect(validateName('legal', siblings).ok).toBe(false)
  })

  it('rejects names over 255 characters', () => {
    expect(validateName('x'.repeat(256), siblings).ok).toBe(false)
  })
})
