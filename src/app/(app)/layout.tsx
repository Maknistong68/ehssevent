import { AuthProvider } from '@/components/auth/auth-provider'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'
import { ImpersonationBanner } from '@/components/shared/impersonation-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-svh bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col md:ps-64">
          <ImpersonationBanner />
          <Header />
          <main className="flex-1 pb-28 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </AuthProvider>
  )
}
