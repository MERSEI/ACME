import type { Entry } from '@/lib/types'
import { collectDescendants, siblingNames } from '@/lib/tree'
import { validateName } from '@/lib/validation'
import { getDB, delay, newId } from './db'
import { ApiError } from './errors'
import { ensureSeeded } from './seed'

export async function listEntries(roomId: string): Promise<Entry[]> {
  await ensureSeeded()
  await delay()
  const db = await getDB()
  return db.getAllFromIndex('entries', 'by-room', roomId)
}

export async function createFolder(
  roomId: string,
  parentId: string | null,
  rawName: string,
): Promise<Entry> {
  await delay()
  const db = await getDB()
  if (!(await db.get('rooms', roomId))) throw new ApiError('NOT_FOUND', 'Data room not found.')
  const entries = await db.getAllFromIndex('entries', 'by-room', roomId)
  const result = validateName(rawName, siblingNames(entries, parentId))
  if (!result.ok) {
    throw new ApiError(result.error.includes('exists') ? 'DUPLICATE_NAME' : 'VALIDATION', result.error)
  }
  const now = Date.now()
  const folder: Entry = {
    id: newId(),
    roomId,
    parentId,
    type: 'folder',
    name: result.name,
    createdAt: now,
    updatedAt: now,
  }
  await db.put('entries', folder)
  return folder
}

export async function renameEntry(id: string, rawName: string): Promise<Entry> {
  await delay()
  const db = await getDB()
  const entry = await db.get('entries', id)
  if (!entry) throw new ApiError('NOT_FOUND', 'Item not found.')
  const entries = await db.getAllFromIndex('entries', 'by-room', entry.roomId)
  const result = validateName(rawName, siblingNames(entries, entry.parentId, id))
  if (!result.ok) {
    throw new ApiError(result.error.includes('exists') ? 'DUPLICATE_NAME' : 'VALIDATION', result.error)
  }
  const updated: Entry = { ...entry, name: result.name, updatedAt: Date.now() }
  await db.put('entries', updated)
  return updated
}

/** Deletes an entry; for folders the whole subtree (entries + blobs) goes in one transaction. */
export async function deleteEntry(id: string): Promise<void> {
  await delay()
  const db = await getDB()
  const entry = await db.get('entries', id)
  if (!entry) throw new ApiError('NOT_FOUND', 'Item not found.')
  const entries = await db.getAllFromIndex('entries', 'by-room', entry.roomId)
  const doomed = [entry, ...collectDescendants(entries, entry.id)]
  const tx = db.transaction(['entries', 'blobs'], 'readwrite')
  await Promise.all([
    ...doomed.map((e) => tx.objectStore('entries').delete(e.id)),
    ...doomed.filter((e) => e.type === 'file').map((e) => tx.objectStore('blobs').delete(e.id)),
    tx.done,
  ])
}
