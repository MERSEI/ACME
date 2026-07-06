import type { DataRoom, Entry } from '@/lib/types'
import { getDB, newId } from './db'
import { buildPdf } from './pdf'

const SEED_FLAG = 'acme-dataroom:seeded:v1'

let seedPromise: Promise<void> | undefined

/**
 * Creates a demo data room on first launch so reviewers land on a populated
 * UI instead of an empty screen. Runs at most once (localStorage flag).
 */
export function ensureSeeded(): Promise<void> {
  seedPromise ??= seed()
  return seedPromise
}

async function seed(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG)) return
  const db = await getDB()
  if ((await db.count('rooms')) > 0) {
    localStorage.setItem(SEED_FLAG, '1')
    return
  }

  const now = Date.now()
  const room: DataRoom = {
    id: newId(),
    name: 'Project Neptune — Due Diligence',
    createdAt: now,
    updatedAt: now,
  }

  const folder = (name: string, parentId: string | null): Entry => ({
    id: newId(),
    roomId: room.id,
    parentId,
    type: 'folder',
    name,
    createdAt: now,
    updatedAt: now,
  })

  const financials = folder('Financials', null)
  const legal = folder('Legal', null)
  const contracts = folder('Contracts', legal.id)
  const hr = folder('HR', null)

  const documents: { entry: Entry; blob: Blob }[] = [
    ['Annual Report 2025.pdf', financials.id, 'Consolidated financial statements for FY2025.'],
    ['Q1 2026 P&L.pdf', financials.id, 'Quarterly profit and loss summary.'],
    ['Master Service Agreement.pdf', contracts.id, 'MSA between Acme Corp. and Neptune Inc.'],
    ['Certificate of Incorporation.pdf', legal.id, 'Company formation documents.'],
    ['Org Chart.pdf', hr.id, 'Organization structure as of June 2026.'],
  ].map(([name, parentId, line]) => {
    const blob = buildPdf(name.replace(/\.pdf$/, ''), [line, 'Seeded demo document — Acme Data Rooms MVP.'])
    return {
      entry: {
        id: newId(),
        roomId: room.id,
        parentId,
        type: 'file' as const,
        name,
        size: blob.size,
        createdAt: now,
        updatedAt: now,
      },
      blob,
    }
  })

  const tx = db.transaction(['rooms', 'entries', 'blobs'], 'readwrite')
  await Promise.all([
    tx.objectStore('rooms').put(room),
    ...[financials, legal, contracts, hr].map((f) => tx.objectStore('entries').put(f)),
    ...documents.map((d) => tx.objectStore('entries').put(d.entry)),
    ...documents.map((d) => tx.objectStore('blobs').put({ id: d.entry.id, blob: d.blob })),
    tx.done,
  ])
  localStorage.setItem(SEED_FLAG, '1')
}
