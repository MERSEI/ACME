import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  children?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="animate-in flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-16 fade-in-0 slide-in-from-bottom-2 text-center duration-500 ease-out">
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-muted to-muted/40 ring-1 ring-border [animation:float_4s_ease-in-out_infinite]">
        <Icon className="h-7 w-7 text-muted-foreground/70" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}
