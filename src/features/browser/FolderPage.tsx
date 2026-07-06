import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, FolderPlus, FolderOpen, Search, SearchX, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { NameDialog } from '@/components/NameDialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { NotFound } from '@/components/NotFound'
import {
  buildBreadcrumbs,
  childrenOf,
  collectDescendants,
  countByType,
  entryPath,
  siblingNames,
  sortEntries,
} from '@/lib/tree'
import { formatStats } from '@/lib/format'
import { downloadEntry } from '@/lib/download'
import { toUserMessage } from '@/api/errors'
import type { Entry } from '@/lib/types'
import { useEntriesStore } from '@/stores/entries.store'
import { Breadcrumbs } from './Breadcrumbs'
import { NodeTable, type NodeRow } from './NodeTable'
import { DropZone } from '@/features/upload/DropZone'
import { useUpload } from '@/features/upload/useUpload'
import { PdfPreviewDialog } from '@/features/preview/PdfPreviewDialog'

type DialogState =
  | { kind: 'create-folder' }
  | { kind: 'rename'; entry: Entry }
  | { kind: 'delete'; entry: Entry }
  | null

export function FolderPage() {
  const { roomId, folderId } = useParams()
  const navigate = useNavigate()
  const store = useEntriesStore()
  const { room, entries, status } = store

  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [previewEntry, setPreviewEntry] = useState<Entry | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadState, handleFiles } = useUpload()

  useEffect(() => {
    if (roomId) void store.load(roomId)
    setQuery('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const currentFolderId = folderId ?? null
  const loading = status === 'loading' || status === 'idle' || store.roomId !== roomId

  const currentFolder = currentFolderId
    ? entries.find((e) => e.id === currentFolderId && e.type === 'folder')
    : undefined

  const chain = useMemo(
    () => (currentFolderId ? buildBreadcrumbs(entries, currentFolderId) : []),
    [entries, currentFolderId],
  )

  const listedRows: NodeRow[] = useMemo(
    () => sortEntries(childrenOf(entries, currentFolderId)).map((entry) => ({ entry })),
    [entries, currentFolderId],
  )

  const trimmedQuery = query.trim().toLowerCase()
  const searchRows: NodeRow[] | null = useMemo(() => {
    if (!trimmedQuery) return null
    return sortEntries(entries.filter((e) => e.name.toLowerCase().includes(trimmedQuery))).map(
      (entry) => ({ entry, path: entryPath(entries, entry) }),
    )
  }, [entries, trimmedQuery])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <div className="flex justify-between gap-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-56" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }
  if (status === 'error') {
    return <ErrorState onRetry={() => roomId && void store.load(roomId)} />
  }
  if (!room) {
    return (
      <NotFound
        title="Data room not found"
        description="This data room doesn't exist or has been deleted."
      />
    )
  }
  if (currentFolderId && !currentFolder) {
    return (
      <NotFound
        title="Folder not found"
        description="This folder doesn't exist or has been deleted."
        backTo={`/room/${room.id}`}
        backLabel={`Back to ${room.name}`}
      />
    )
  }

  const rows = searchRows ?? listedRows
  const searching = searchRows != null

  function openEntry(entry: Entry) {
    if (entry.type === 'folder') {
      setQuery('')
      navigate(`/room/${room!.id}/folder/${entry.id}`)
    } else {
      setPreviewEntry(entry)
    }
  }

  function deleteDescription(entry: Entry): string {
    if (entry.type === 'file') {
      return `This will permanently delete "${entry.name}". This action cannot be undone.`
    }
    const stats = countByType(collectDescendants(entries, entry.id))
    const contents =
      stats.folders + stats.files > 0
        ? ` and everything inside it (${formatStats(stats.folders, stats.files).toLowerCase()})`
        : ''
    return `This will permanently delete "${entry.name}"${contents}. This action cannot be undone.`
  }

  const renameTaken =
    dialog?.kind === 'rename'
      ? siblingNames(entries, dialog.entry.parentId, dialog.entry.id)
      : new Set<string>()

  const parentHref = currentFolder?.parentId
    ? `/room/${room.id}/folder/${currentFolder.parentId}`
    : currentFolderId
      ? `/room/${room.id}`
      : '/'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="group/back -ml-1.5 h-7 w-7 shrink-0"
          onClick={() => navigate(parentHref)}
          aria-label={currentFolderId ? 'Back to parent folder' : 'Back to data rooms'}
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover/back:-translate-x-0.5" />
        </Button>
        <Breadcrumbs room={room} chain={chain} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search in ${room.name}`}
            className="pl-8 pr-8"
            aria-label="Search files and folders"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setDialog({ kind: 'create-folder' })}>
            <FolderPlus className="h-4 w-4" /> New folder
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(currentFolderId, e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <DropZone
        uploadState={uploadState}
        onFiles={(files) => void handleFiles(currentFolderId, files)}
      >
        {rows.length === 0 ? (
          searching ? (
            <EmptyState
              icon={SearchX}
              title="No matches"
              description={`Nothing in this data room matches "${query.trim()}".`}
            >
              <Button variant="outline" onClick={() => setQuery('')}>
                Clear search
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="This folder is empty"
              description="Upload PDF documents or create a folder to organize them. You can also drag and drop files anywhere on this area."
            >
              <Button variant="outline" onClick={() => setDialog({ kind: 'create-folder' })}>
                <FolderPlus className="h-4 w-4" /> New folder
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload files
              </Button>
            </EmptyState>
          )
        ) : (
          <>
            {searching && (
              <p className="mb-2 text-sm text-muted-foreground">
                {rows.length} result{rows.length === 1 ? '' : 's'} in {room.name}
              </p>
            )}
            <NodeTable
              rows={rows}
              showPath={searching}
              onOpen={openEntry}
              onRename={(entry) => setDialog({ kind: 'rename', entry })}
              onDelete={(entry) => setDialog({ kind: 'delete', entry })}
              onDownload={(entry) => void downloadEntry(entry)}
            />
          </>
        )}
      </DropZone>

      <NameDialog
        open={dialog?.kind === 'create-folder'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="New folder"
        label="Folder name"
        submitLabel="Create"
        takenNames={siblingNames(entries, currentFolderId)}
        onSubmit={async (name) => {
          await store.createFolder(currentFolderId, name)
        }}
      />

      <NameDialog
        open={dialog?.kind === 'rename'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.kind === 'rename' && dialog.entry.type === 'file' ? 'Rename file' : 'Rename folder'}
        label="Name"
        submitLabel="Rename"
        initialValue={dialog?.kind === 'rename' ? dialog.entry.name : ''}
        takenNames={renameTaken}
        onSubmit={async (name) => {
          if (dialog?.kind !== 'rename') return
          await store.rename(dialog.entry.id, name)
        }}
      />

      <ConfirmDeleteDialog
        open={dialog?.kind === 'delete'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.kind === 'delete' ? `Delete "${dialog.entry.name}"?` : 'Delete?'}
        description={dialog?.kind === 'delete' ? deleteDescription(dialog.entry) : ''}
        onConfirm={async () => {
          if (dialog?.kind !== 'delete') return
          const name = dialog.entry.name
          try {
            await store.remove(dialog.entry.id)
            toast.success(`Deleted "${name}"`)
          } catch (error) {
            toast.error(toUserMessage(error))
          }
        }}
      />

      <PdfPreviewDialog
        entry={previewEntry}
        onOpenChange={(open) => !open && setPreviewEntry(null)}
        onRename={(entry) => {
          setPreviewEntry(null)
          setDialog({ kind: 'rename', entry })
        }}
        onDelete={(entry) => {
          setPreviewEntry(null)
          setDialog({ kind: 'delete', entry })
        }}
      />
    </div>
  )
}
