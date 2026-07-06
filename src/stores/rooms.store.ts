import { create } from 'zustand'
import type { DataRoom, RoomStats } from '@/lib/types'
import * as roomsApi from '@/api/rooms.api'

export type RoomWithStats = DataRoom & RoomStats

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface RoomsState {
  rooms: RoomWithStats[]
  status: LoadStatus
  load: () => Promise<void>
  create: (name: string) => Promise<DataRoom>
  rename: (id: string, name: string) => Promise<void>
  /** Optimistic: the card disappears immediately and comes back on failure. */
  remove: (id: string) => Promise<void>
}

export const useRoomsStore = create<RoomsState>((set, get) => ({
  rooms: [],
  status: 'idle',

  async load() {
    set({ status: 'loading' })
    try {
      set({ rooms: await roomsApi.listRooms(), status: 'ready' })
    } catch {
      set({ status: 'error' })
    }
  },

  async create(name) {
    const room = await roomsApi.createRoom(name)
    set({ rooms: [{ ...room, folders: 0, files: 0 }, ...get().rooms] })
    return room
  },

  async rename(id, name) {
    const updated = await roomsApi.renameRoom(id, name)
    set({
      rooms: get().rooms.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    })
  },

  async remove(id) {
    const snapshot = get().rooms
    set({ rooms: snapshot.filter((r) => r.id !== id) })
    try {
      await roomsApi.deleteRoom(id)
    } catch (error) {
      set({ rooms: snapshot })
      throw error
    }
  },
}))
