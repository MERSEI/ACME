export const MAX_NAME_LENGTH = 255
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export type NameValidation = { ok: true; name: string } | { ok: false; error: string }

/**
 * Validates a room/folder/file name and normalizes it (trims whitespace).
 * `taken` is the set of lowercased sibling names the value must not collide with.
 */
export function validateName(raw: string, taken: Set<string>): NameValidation {
  const name = raw.trim()
  if (name.length === 0) return { ok: false, error: 'Name cannot be empty.' }
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Name is too long (max ${MAX_NAME_LENGTH} characters).` }
  }
  if (taken.has(name.toLowerCase())) {
    return { ok: false, error: 'An item with this name already exists here.' }
  }
  return { ok: true, name }
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export type FileRejection = { file: File; reason: 'not-pdf' | 'too-large' }

export function partitionFiles(files: File[]): { accepted: File[]; rejected: FileRejection[] } {
  const accepted: File[] = []
  const rejected: FileRejection[] = []
  for (const file of files) {
    if (!isPdfFile(file)) rejected.push({ file, reason: 'not-pdf' })
    else if (file.size > MAX_FILE_SIZE) rejected.push({ file, reason: 'too-large' })
    else accepted.push(file)
  }
  return { accepted, rejected }
}
