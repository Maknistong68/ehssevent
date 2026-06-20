'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ImpersonationBanner } from '@/components/shared/impersonation-banner'

const STORAGE_KEY = 'sidebar-collapsed'

// Tiny localStorage-backed store so the collapse preference survives reloads
// and is read without a setState-in-effect (avoids hydration mismatch via the
// server snapshot defaulting to expanded).
const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  window.addEventListener('storage', callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', callback)
  }
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function getServerSnapshot() {
  return false
}

function setCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // ignore (private mode / unavailable storage)
  }
  listeners.forEach((listener) => listener())
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const toggle = useCallback(() => setCollapsed(!getSnapshot()), [])

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div
        className={cn(
          'flex flex-1 flex-col transition-[padding] duration-300 ease-out',
          collapsed ? 'md:ps-[4.75rem]' : 'md:ps-64'
        )}
      >
        <ImpersonationBanner />
        <Header />
        <main className="flex-1 pb-28 md:pb-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
