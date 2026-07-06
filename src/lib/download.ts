import { toast } from 'sonner'
import { getFileBlob } from '@/api/files.api'
import { toUserMessage } from '@/api/errors'
import type { Entry } from './types'

export async function downloadEntry(entry: Entry): Promise<void> {
  try {
    const blob = await getFileBlob(entry.id)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = entry.name
    anchor.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    toast.error(toUserMessage(error))
  }
}
