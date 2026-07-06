import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { DataRoom, Entry } from '@/lib/types'

interface BreadcrumbsProps {
  room: DataRoom
  /** Folder chain from the room root to the current folder; empty at the root. */
  chain: Entry[]
}

export function Breadcrumbs({ room, chain }: BreadcrumbsProps) {
  // Deep nesting collapses to: Room / … / Parent / Current
  const collapsed = chain.length > 3
  const visible = collapsed ? chain.slice(-2) : chain

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {chain.length === 0 ? (
            <BreadcrumbPage className="max-w-56 truncate font-medium" title={room.name}>
              {room.name}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              render={<Link to={`/room/${room.id}`} />}
              className="max-w-56 truncate"
              title={room.name}
            >
              {room.name}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {collapsed && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
          </>
        )}
        {visible.map((folder, i) => {
          const isLast = i === visible.length - 1
          return (
            <Fragment key={folder.id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="max-w-56 truncate font-medium" title={folder.name}>
                    {folder.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link to={`/room/${room.id}/folder/${folder.id}`} />}
                    className="max-w-56 truncate"
                    title={folder.name}
                  >
                    {folder.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
