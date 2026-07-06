import { useEffect, useState } from 'react'
import { Download, FileText, Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getFileBlob } from '@/api/files.api'
import { downloadEntry } from '@/lib/download'
import { formatBytes } from '@/lib/format'
import type { Entry } from '@/lib/types'

interface PdfPreviewDialogProps {
  entry: Entry | null
  onOpenChange: (open: boolean) => void
  onRename: (entry: Entry) => void
  onDelete: (entry: Entry) => void
}

/** Near-fullscreen PDF viewer built on the browser's native renderer. */
export function PdfPreviewDialog({ entry, onOpenChange, onRename, onDelete }: PdfPreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!entry) return
    let objectUrl: string | null = null
    let cancelled = false
    setUrl(null)
    setError(false)
    getFileBlob(entry.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [entry])

  return (
    <Dialog open={entry != null} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(72rem,95vw)]">
        {entry && (
          <>
            <div className="flex items-center gap-2 border-b py-2 pl-4 pr-12">
              <FileText className="h-4 w-4 shrink-0 text-red-500/80" aria-hidden />
              <DialogTitle className="min-w-0 truncate text-sm font-medium" title={entry.name}>
                {entry.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Preview of {entry.name}
              </DialogDescription>
              {entry.size != null && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(entry.size)}
                </span>
              )}
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => void downloadEntry(entry)}>
                  <Download className="h-4 w-4" /> Download
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" aria-label="More actions" />}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onRename(entry)}>
                      <Pencil className="h-4 w-4" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(entry)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex-1 bg-muted/40">
              {error ? (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  Couldn't load this file. It may have been deleted from browser storage.
                </div>
              ) : url ? (
                <iframe src={url} title={entry.name} className="h-full w-full border-0" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading PDF" />
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
