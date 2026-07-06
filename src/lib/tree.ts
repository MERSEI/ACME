import type { Entry, RoomStats } from './types'

/** Folders first, then case-insensitive natural order (report 2 < report 10). */
export function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  })
}

export function childrenOf(entries: Entry[], parentId: string | null): Entry[] {
  return entries.filter((e) => e.parentId === parentId)
}

/** Every entry inside `rootId`'s subtree, excluding the root itself (BFS). */
export function collectDescendants(entries: Entry[], rootId: string): Entry[] {
  const byParent = new Map<string | null, Entry[]>()
  for (const e of entries) {
    const list = byParent.get(e.parentId)
    if (list) list.push(e)
    else byParent.set(e.parentId, [e])
  }
  const result: Entry[] = []
  const queue = [rootId]
  while (queue.length > 0) {
    const children = byParent.get(queue.shift()!) ?? []
    for (const child of children) {
      result.push(child)
      if (child.type === 'folder') queue.push(child.id)
    }
  }
  return result
}

/** Chain of folders from the room root down to `folderId` (inclusive). */
export function buildBreadcrumbs(entries: Entry[], folderId: string): Entry[] {
  const byId = new Map(entries.map((e) => [e.id, e]))
  const chain: Entry[] = []
  const seen = new Set<string>()
  let current = byId.get(folderId)
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    chain.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return chain
}

/** Human-readable folder path of an entry, e.g. "Legal / Contracts". Empty string at root. */
export function entryPath(entries: Entry[], entry: Entry): string {
  if (!entry.parentId) return ''
  return buildBreadcrumbs(entries, entry.parentId)
    .map((e) => e.name)
    .join(' / ')
}

/** Lowercased names of an entry's siblings, used for duplicate checks. */
export function siblingNames(entries: Entry[], parentId: string | null, excludeId?: string): Set<string> {
  const names = new Set<string>()
  for (const e of entries) {
    if (e.parentId === parentId && e.id !== excludeId) names.add(e.name.toLowerCase())
  }
  return names
}

/** Resolves a name collision the Google Drive way: "report.pdf" -> "report (1).pdf". */
export function uniqueName(name: string, taken: Set<string>): string {
  if (!taken.has(name.toLowerCase())) return name
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  for (let i = 1; ; i++) {
    const candidate = `${base} (${i})${ext}`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
}

export function countByType(entries: Entry[]): RoomStats {
  let folders = 0
  let files = 0
  for (const e of entries) {
    if (e.type === 'folder') folders++
    else files++
  }
  return { folders, files }
}
