export interface DataRoom {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export interface RoomStats {
  folders: number
  files: number
}

export type EntryType = 'folder' | 'file'

/** A single node of a data room tree: either a folder or an uploaded file. */
export interface Entry {
  id: string
  roomId: string
  /** `null` means the entry lives at the room root. */
  parentId: string | null
  type: EntryType
  name: string
  /** File size in bytes; absent for folders. */
  size?: number
  createdAt: number
  updatedAt: number
}
