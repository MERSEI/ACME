import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { UploadState } from './useUpload'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  uploadState: UploadState
  children: React.ReactNode
}

/** Wraps the folder view: dropping files anywhere on it starts an upload. */
export function DropZone({ onFiles, uploadState, children }: DropZoneProps) {
  const [isOver, setIsOver] = useState(false)
  // dragenter/dragleave fire on every child; a depth counter avoids flicker.
  const depth = useRef(0)

  function hasFiles(event: React.DragEvent) {
    return Array.from(event.dataTransfer.types).includes('Files')
  }

  return (
    <div
      className="relative min-h-72"
      onDragEnter={(e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        depth.current++
        setIsOver(true)
      }}
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault()
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setIsOver(false)
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        depth.current = 0
        setIsOver(false)
        onFiles(Array.from(e.dataTransfer.files))
      }}
    >
      {children}

      {isOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-background/90">
          <div className="flex flex-col items-center gap-2 text-center">
            <UploadCloud className="h-10 w-10 text-primary" aria-hidden />
            <p className="font-medium">Drop PDF files to upload</p>
            <p className="text-sm text-muted-foreground">Files land in the current folder</p>
          </div>
        </div>
      )}

      {uploadState.active && (
        <Card className="fixed bottom-4 right-4 z-50 w-72 gap-2 p-4 shadow-lg">
          <p className="text-sm font-medium">
            Uploading {uploadState.count} file{uploadState.count === 1 ? '' : 's'}…
          </p>
          <Progress value={uploadState.progress} aria-label="Upload progress" />
        </Card>
      )}
    </div>
  )
}
