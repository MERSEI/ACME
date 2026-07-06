import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Vault } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

export default function App() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className={cn(
          'sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md transition-shadow duration-300',
          scrolled ? 'border-border shadow-sm' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <Link
            to="/"
            className="group flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/30 transition-transform duration-200 group-hover:scale-105">
              <Vault className="h-4 w-4" aria-hidden />
            </span>
            Acme Data Rooms
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div
          key={location.pathname}
          className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-out"
        >
          <Outlet />
        </div>
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
