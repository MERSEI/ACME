export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes
  let unit = ''
  for (const u of units) {
    value /= 1024
    unit = u
    if (value < 1024) break
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${unit}`
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDate(timestamp: number): string {
  return dateFormat.format(new Date(timestamp))
}

/** "3 folders, 12 files" — omits zero parts, "Empty" when both are zero. */
export function formatStats(folders: number, files: number): string {
  const parts: string[] = []
  if (folders > 0) parts.push(`${folders} folder${folders === 1 ? '' : 's'}`)
  if (files > 0) parts.push(`${files} file${files === 1 ? '' : 's'}`)
  return parts.length > 0 ? parts.join(', ') : 'Empty'
}
