import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { DataRoom, Entry } from '@/lib/types'

interface DataRoomDB extends DBSchema {
  rooms: { key: string; value: DataRoom }
  entries: {
    key: string
    value: Entry
    indexes: { 'by-room': string }
  }
  blobs: { key: string; value: { id: string; blob: Blob } }
}

let dbPromise: Promise<IDBPDatabase<DataRoomDB>> | undefined

export function getDB(): Promise<IDBPDatabase<DataRoomDB>> {
  dbPromise ??= openDB<DataRoomDB>('acme-dataroom', 1, {
    upgrade(db) {
      db.createObjectStore('rooms', { keyPath: 'id' })
      const entries = db.createObjectStore('entries', { keyPath: 'id' })
      entries.createIndex('by-room', 'roomId')
      db.createObjectStore('blobs', { keyPath: 'id' })
    },
  })
  return dbPromise
}

/** Simulated network latency so loading states are real, not theoretical. */
export function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 150))
}

export function newId(): string {
  return crypto.randomUUID()
}
