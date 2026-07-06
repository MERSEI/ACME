import { create } from 'zustand'
import type { DataRoom, Entry } from '@/lib/types'
import { collectDescendants } from '@/lib/tree'
import * as roomsApi from '@/api/rooms.api'
import * as entriesApi from '@/api/entries.api'
import * as filesApi from '@/api/files.api'
import type { UploadResult } from '@/api/files.api'
import type { LoadStatus } from './rooms.store'

interface EntriesState {
  roomId: string | null
  /** `null` after a successful load means the room does not exist. */
  room: DataRoom | null
  entries: Entry[]
  status: LoadStatus
  load: (roomId: string) => Promise<void>
  createFolder: (parentId: string | null, name: string) => Promise<Entry>
  /** Optimistic: the row updates immediately and rolls back on failure. */
  rename: (id: string, name: string) => Promise<void>
  /** Optimistic: the subtree disappears immediately and rolls back on failure. */
  remove: (id: string) => Promise<void>
  upload: (parentId: string | null, files: File[]) => Promise<UploadResult>
}

export const useEntriesStore = create<EntriesState>((set, get) => ({
  roomId: null,
  room: null,
  entries: [],
  status: 'idle',

  async load(roomId) {
    set({ roomId, status: 'loading', entries: [], room: null })
    try {
      const [room, entries] = await Promise.all([
        roomsApi.getRoom(roomId),
        entriesApi.listEntries(roomId),
      ])
      // Ignore stale responses if the user already navigated to another room.
      if (get().roomId !== roomId) return
      set({ room: room ?? null, entries, status: 'ready' })
    } catch {
      if (get().roomId === roomId) set({ status: 'error' })
    }
  },

  async createFolder(parentId, name) {
    const roomId = get().roomId
    if (!roomId) throw new Error('No room loaded')
    const folder = await entriesApi.createFolder(roomId, parentId, name)
    set({ entries: [...get().entries, folder] })
    return folder
  },

  async rename(id, name) {
    const snapshot = get().entries
    set({
      entries: snapshot.map((e) =>
        e.id === id ? { ...e, name: name.trim(), updatedAt: Date.now() } : e,
      ),
    })
    try {
      const updated = await entriesApi.renameEntry(id, name)
      set({ entries: get().entries.map((e) => (e.id === id ? updated : e)) })
    } catch (error) {
      set({ entries: snapshot })
      throw error
    }
  },

  async remove(id) {
    const snapshot = get().entries
    // Mirror the API's cascade so the optimistic view matches the outcome.
    const doomed = new Set([id, ...collectDescendants(snapshot, id).map((e) => e.id)])
    set({ entries: snapshot.filter((e) => !doomed.has(e.id)) })
    try {
      await entriesApi.deleteEntry(id)
    } catch (error) {
      set({ entries: snapshot })
      throw error
    }
  },

  async upload(parentId, files) {
    const roomId = get().roomId
    if (!roomId) throw new Error('No room loaded')
    const result = await filesApi.uploadFiles(roomId, parentId, files)
    if (get().roomId === roomId) {
      set({ entries: [...get().entries, ...result.created] })
    }
    return result
  },
}))
