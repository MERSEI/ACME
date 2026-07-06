import { Folder, FileText, MoreVertical, Pencil, Trash2, Download } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatBytes, formatDate } from '@/lib/format'
import type { Entry } from '@/lib/types'

export interface NodeRow {
  entry: Entry
  /** Folder path shown in search results, e.g. "Legal / Contracts". */
  path?: string
}

interface NodeTableProps {
  rows: NodeRow[]
  /** Search mode adds a Location column. */
  showPath?: boolean
  onOpen: (entry: Entry) => void
  onRename: (entry: Entry) => void
  onDelete: (entry: Entry) => void
  onDownload: (entry: Entry) => void
}

export function NodeTable({ rows, showPath = false, onOpen, onRename, onDelete, onDownload }: NodeTableProps) {
  return (
    <div className="animate-in overflow-hidden rounded-lg border fade-in-0 duration-300 ease-out">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            {showPath && <TableHead className="hidden md:table-cell">Location</TableHead>}
            <TableHead className="hidden w-24 sm:table-cell">Size</TableHead>
            <TableHead className="hidden w-32 md:table-cell">Modified</TableHead>
            <TableHead className="w-12" aria-label="Actions" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ entry, path }) => (
            <TableRow key={entry.id} className="group">
              <TableCell className="max-w-0 w-full py-2">
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="flex w-full min-w-0 items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {entry.type === 'folder' ? (
                    <Folder
                      className="h-4 w-4 shrink-0 fill-muted-foreground/20 text-muted-foreground transition-colors group-hover:fill-primary/20 group-hover:text-primary"
                      aria-hidden
                    />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-red-500/80" aria-hidden />
                  )}
                  <span className="truncate font-medium group-hover:underline" title={entry.name}>
                    {entry.name}
                  </span>
                </button>
              </TableCell>
              {showPath && (
                <TableCell className="hidden max-w-48 truncate text-muted-foreground md:table-cell" title={path}>
                  {path || '—'}
                </TableCell>
              )}
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {entry.type === 'file' && entry.size != null ? formatBytes(entry.size) : '—'}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatDate(entry.updatedAt)}
              </TableCell>
              <TableCell className="py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-60 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
                        aria-label={`Actions for ${entry.name}`}
                      />
                    }
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {entry.type === 'file' && (
                      <DropdownMenuItem onClick={() => onDownload(entry)}>
                        <Download className="h-4 w-4" /> Download
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onRename(entry)}>
                      <Pencil className="h-4 w-4" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(entry)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
