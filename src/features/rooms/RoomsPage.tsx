import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FolderLock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NameDialog } from '@/components/NameDialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { formatStats } from '@/lib/format'
import { toUserMessage } from '@/api/errors'
import { useRoomsStore, type RoomWithStats } from '@/stores/rooms.store'
import { RoomCard } from './RoomCard'

type DialogState =
  | { kind: 'create' }
  | { kind: 'rename'; room: RoomWithStats }
  | { kind: 'delete'; room: RoomWithStats }
  | null

export function RoomsPage() {
  const navigate = useNavigate()
  const { rooms, status, load, create, rename, remove } = useRoomsStore()
  const [dialog, setDialog] = useState<DialogState>(null)

  useEffect(() => {
    void load()
  }, [load])

  const takenNames = useMemo(() => {
    const excludeId = dialog?.kind === 'rename' ? dialog.room.id : undefined
    return new Set(rooms.filter((r) => r.id !== excludeId).map((r) => r.name.toLowerCase()))
  }, [rooms, dialog])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Secure repositories for your due diligence documents.
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: 'create' })}>
          <Plus className="h-4 w-4" /> New data room
        </Button>
      </div>

      {status === 'loading' || status === 'idle' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : status === 'error' ? (
        <ErrorState onRetry={() => void load()} />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={FolderLock}
          title="No data rooms yet"
          description="Create your first data room to start organizing documents for due diligence."
        >
          <Button onClick={() => setDialog({ kind: 'create' })}>
            <Plus className="h-4 w-4" /> New data room
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onRename={() => setDialog({ kind: 'rename', room })}
              onDelete={() => setDialog({ kind: 'delete', room })}
            />
          ))}
        </div>
      )}

      <NameDialog
        open={dialog?.kind === 'create'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="New data room"
        description="A data room is the top-level container for a deal's documents."
        label="Name"
        submitLabel="Create"
        takenNames={takenNames}
        onSubmit={async (name) => {
          const room = await create(name)
          navigate(`/room/${room.id}`)
        }}
      />

      <NameDialog
        open={dialog?.kind === 'rename'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Rename data room"
        label="Name"
        submitLabel="Rename"
        initialValue={dialog?.kind === 'rename' ? dialog.room.name : ''}
        takenNames={takenNames}
        onSubmit={async (name) => {
          if (dialog?.kind !== 'rename') return
          await rename(dialog.room.id, name)
        }}
      />

      <ConfirmDeleteDialog
        open={dialog?.kind === 'delete'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.kind === 'delete' ? `Delete "${dialog.room.name}"?` : 'Delete data room?'}
        description={
          dialog?.kind === 'delete' && dialog.room.folders + dialog.room.files > 0
            ? `This will permanently delete ${formatStats(dialog.room.folders, dialog.room.files).toLowerCase()} inside this data room. This action cannot be undone.`
            : 'This data room is empty. This action cannot be undone.'
        }
        onConfirm={async () => {
          if (dialog?.kind !== 'delete') return
          const name = dialog.room.name
          try {
            await remove(dialog.room.id)
            toast.success(`Deleted "${name}"`)
          } catch (error) {
            toast.error(toUserMessage(error))
          }
        }}
      />
    </div>
  )
}
