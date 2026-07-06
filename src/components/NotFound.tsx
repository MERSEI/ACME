import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from './EmptyState'

interface NotFoundProps {
  title?: string
  description?: string
  backTo?: string
  backLabel?: string
}

export function NotFound({
  title = 'Page not found',
  description = "The page you're looking for doesn't exist.",
  backTo = '/',
  backLabel = 'Back to data rooms',
}: NotFoundProps) {
  return (
    <EmptyState icon={FileQuestion} title={title} description={description}>
      <Button nativeButton={false} render={<Link to={backTo} />}>
        {backLabel}
      </Button>
    </EmptyState>
  )
}
