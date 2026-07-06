import { Link } from 'react-router-dom'
import { FolderLock, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, formatStats } from '@/lib/format'
import type { RoomWithStats } from '@/stores/rooms.store'

interface RoomCardProps {
  room: RoomWithStats
  /** Stagger index for the entrance animation. */
  index?: number
  onRename: () => void
  onDelete: () => void
}

export function RoomCard({ room, index = 0, onRename, onDelete }: RoomCardProps) {
  return (
    <Card
      className="group relative animate-in gap-0 fade-in-0 slide-in-from-bottom-2 p-4 fill-mode-backwards duration-300 ease-out transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5 hover:ring-foreground/15"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <Link
        to={`/room/${room.id}`}
        className="absolute inset-0 rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`Open ${room.name}`}
      />
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary transition-transform duration-200 ease-out group-hover:scale-110">
          <FolderLock className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium" title={room.name}>
            {room.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatStats(room.folders, room.files)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Created {formatDate(room.createdAt)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative -mr-1 -mt-1 shrink-0 opacity-60 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
                aria-label={`Actions for ${room.name}`}
              />
            }
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="h-4 w-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
