import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateName } from '@/lib/validation'
import { ApiError } from '@/api/errors'

interface NameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  label: string
  submitLabel: string
  initialValue?: string
  /** Lowercased sibling names the new value must not collide with. */
  takenNames: Set<string>
  onSubmit: (name: string) => Promise<void>
}

/** Shared create/rename dialog with inline validation. */
export function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  submitLabel,
  initialValue = '',
  takenNames,
  onSubmit,
}: NameDialogProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
      setError(null)
      setSubmitting(false)
    }
  }, [open, initialValue])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = validateName(value, takenNames)
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (result.name === initialValue) {
      onOpenChange(false)
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(result.name)
      onOpenChange(false)
    } catch (err) {
      // Keep the dialog open on validation-type errors so the user can fix the name.
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="name-dialog-input">{label}</Label>
            <Input
              id="name-dialog-input"
              value={value}
              autoFocus
              aria-invalid={error != null}
              onChange={(e) => {
                setValue(e.target.value)
                setError(null)
              }}
              onFocus={(e) => {
                // Preselect the base name so typing replaces it, like Finder/Drive rename.
                const dot = e.target.value.lastIndexOf('.')
                e.target.setSelectionRange(0, dot > 0 ? dot : e.target.value.length)
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || value.trim().length === 0}>
              {submitting ? 'Saving…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
