import type { Entry } from '@/lib/types'
import { siblingNames, uniqueName } from '@/lib/tree'
import { getDB, delay, newId } from './db'
import { ApiError } from './errors'

export interface UploadResult {
  created: Entry[]
  /** Files that were auto-renamed to resolve a name collision. */
  renamed: { from: string; to: string }[]
}

/**
 * Stores PDF files as entries + blobs. Name collisions are resolved
 * server-side with "name (1).pdf" so multi-file uploads never fail midway.
 */
export async function uploadFiles(
  roomId: string,
  parentId: string | null,
  files: File[],
): Promise<UploadResult> {
  await delay()
  const db = await getDB()
  if (!(await db.get('rooms', roomId))) throw new ApiError('NOT_FOUND', 'Data room not found.')
  const entries = await db.getAllFromIndex('entries', 'by-room', roomId)
  const taken = siblingNames(entries, parentId)

  const created: Entry[] = []
  const renamed: { from: string; to: string }[] = []
  const blobs: { id: string; blob: Blob }[] = []
  const now = Date.now()

  for (const file of files) {
    const name = uniqueName(file.name, taken)
    if (name !== file.name) renamed.push({ from: file.name, to: name })
    taken.add(name.toLowerCase())
    const entry: Entry = {
      id: newId(),
      roomId,
      parentId,
      type: 'file',
      name,
      size: file.size,
      createdAt: now,
      updatedAt: now,
    }
    created.push(entry)
    blobs.push({ id: entry.id, blob: file })
  }

  const tx = db.transaction(['entries', 'blobs'], 'readwrite')
  await Promise.all([
    ...created.map((e) => tx.objectStore('entries').put(e)),
    ...blobs.map((b) => tx.objectStore('blobs').put(b)),
    tx.done,
  ])
  return { created, renamed }
}

export async function getFileBlob(id: string): Promise<Blob> {
  const db = await getDB()
  const record = await db.get('blobs', id)
  if (!record) throw new ApiError('NOT_FOUND', 'File content not found.')
  return record.blob
}
