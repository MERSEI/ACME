import { Link, Outlet } from 'react-router-dom'
import { Vault } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="rounded-md bg-primary p-1.5 text-primary-foreground">
              <Vault className="h-4 w-4" aria-hidden />
            </span>
            Acme Data Rooms
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
