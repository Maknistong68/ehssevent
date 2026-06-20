import { AuthProvider } from '@/components/auth/auth-provider'
import { AppShell } from '@/components/layout/app-shell'
import { ReconsentGate } from '@/components/auth/reconsent-gate'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReconsentGate />
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
