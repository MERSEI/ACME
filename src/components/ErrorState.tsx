import { CloudAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from './EmptyState'

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={CloudAlert}
      title="Couldn't load data"
      description="Something went wrong while loading. Check that your browser allows site data and try again."
    >
      <Button onClick={onRetry}>Try again</Button>
    </EmptyState>
  )
}
