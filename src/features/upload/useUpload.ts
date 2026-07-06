import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { partitionFiles } from '@/lib/validation'
import { toUserMessage } from '@/api/errors'
import { useEntriesStore } from '@/stores/entries.store'

export interface UploadState {
  active: boolean
  progress: number
  count: number
}

/**
 * Validates picked/dropped files, uploads the accepted ones and narrates
 * the outcome (rejections, auto-renames) through toasts.
 */
export function useUpload() {
  const upload = useEntriesStore((s) => s.upload)
  const [state, setState] = useState<UploadState>({ active: false, progress: 0, count: 0 })
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  async function handleFiles(parentId: string | null, fileList: FileList | File[]) {
    const { accepted, rejected } = partitionFiles(Array.from(fileList))

    if (rejected.length > 0) {
      const notPdf = rejected.filter((r) => r.reason === 'not-pdf').length
      const tooLarge = rejected.length - notPdf
      const reasons = [
        notPdf > 0 ? `${notPdf} not a PDF` : null,
        tooLarge > 0 ? `${tooLarge} over 50 MB` : null,
      ]
        .filter(Boolean)
        .join(', ')
      toast.error(`${rejected.length} item${rejected.length === 1 ? '' : 's'} skipped (${reasons})`, {
        description: 'Only PDF files up to 50 MB are supported.',
      })
    }
    if (accepted.length === 0) return

    setState({ active: true, progress: 8, count: accepted.length })
    // The mock API has no real transfer to report, so the bar eases to 90%
    // and jumps to 100% on completion — enough to make the state visible.
    timerRef.current = setInterval(() => {
      setState((s) => ({ ...s, progress: Math.min(s.progress + 14, 90) }))
    }, 120)

    try {
      const result = await upload(parentId, accepted)
      setState((s) => ({ ...s, progress: 100 }))
      toast.success(
        `Uploaded ${result.created.length} file${result.created.length === 1 ? '' : 's'}`,
      )
      for (const { from, to } of result.renamed) {
        toast.info(`"${from}" already exists — saved as "${to}"`)
      }
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      clearInterval(timerRef.current)
      setTimeout(() => setState({ active: false, progress: 0, count: 0 }), 500)
    }
  }

  return { uploadState: state, handleFiles }
}
