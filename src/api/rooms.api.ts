import type { DataRoom, RoomStats } from '@/lib/types'
import { countByType } from '@/lib/tree'
import { validateName } from '@/lib/validation'
import { getDB, delay, newId } from './db'
import { ApiError } from './errors'
import { ensureSeeded } from './seed'

async function roomNames(excludeId?: string): Promise<Set<string>> {
  const db = await getDB()
  const rooms = await db.getAll('rooms')
  return new Set(rooms.filter((r) => r.id !== excludeId).map((r) => r.name.toLowerCase()))
}

export async function listRooms(): Promise<(DataRoom & RoomStats)[]> {
  await ensureSeeded()
  await delay()
  const db = await getDB()
  const rooms = await db.getAll('rooms')
  const withStats = await Promise.all(
    rooms.map(async (room) => {
      const entries = await db.getAllFromIndex('entries', 'by-room', room.id)
      return { ...room, ...countByType(entries) }
    }),
  )
  return withStats.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getRoom(id: string): Promise<DataRoom | undefined> {
  await ensureSeeded()
  const db = await getDB()
  return db.get('rooms', id)
}

export async function createRoom(rawName: string): Promise<DataRoom> {
  await delay()
  const result = validateName(rawName, await roomNames())
  if (!result.ok) {
    throw new ApiError(result.error.includes('exists') ? 'DUPLICATE_NAME' : 'VALIDATION', result.error)
  }
  const now = Date.now()
  const room: DataRoom = { id: newId(), name: result.name, createdAt: now, updatedAt: now }
  const db = await getDB()
  await db.put('rooms', room)
  return room
}

export async function renameRoom(id: string, rawName: string): Promise<DataRoom> {
  await delay()
  const db = await getDB()
  const room = await db.get('rooms', id)
  if (!room) throw new ApiError('NOT_FOUND', 'Data room not found.')
  const result = validateName(rawName, await roomNames(id))
  if (!result.ok) {
    throw new ApiError(result.error.includes('exists') ? 'DUPLICATE_NAME' : 'VALIDATION', result.error)
  }
  const updated: DataRoom = { ...room, name: result.name, updatedAt: Date.now() }
  await db.put('rooms', updated)
  return updated
}

/** Deletes the room together with all of its entries and stored file blobs. */
export async function deleteRoom(id: string): Promise<void> {
  await delay()
  const db = await getDB()
  const entries = await db.getAllFromIndex('entries', 'by-room', id)
  const tx = db.transaction(['rooms', 'entries', 'blobs'], 'readwrite')
  await Promise.all([
    tx.objectStore('rooms').delete(id),
    ...entries.map((e) => tx.objectStore('entries').delete(e.id)),
    ...entries.filter((e) => e.type === 'file').map((e) => tx.objectStore('blobs').delete(e.id)),
    tx.done,
  ])
}
