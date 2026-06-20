export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAllOrganizations, getAllProfiles } from '@/lib/queries/admin'
import { requireAdmin } from '@/lib/auth/guards'
import { AdminOrganizations } from './organizations'
import { AdminUsers } from './users'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata = {
  title: 'Admin - Event Report',
}

export default async function AdminPage() {
  const auth = await requireAdmin()
  if (!auth.ok) redirect('/dashboard')

  const [organizations, profiles] = await Promise.all([
    getAllOrganizations(),
    getAllProfiles(),
  ])

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">
          Manage organizations and users
        </p>
      </div>

      <Tabs defaultValue="organizations">
        <TabsList>
          <TabsTrigger value="organizations">
            Organizations ({organizations.length})
          </TabsTrigger>
          <TabsTrigger value="users">Users ({profiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="mt-4">
          <AdminOrganizations organizations={organizations} />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <AdminUsers profiles={profiles} organizations={organizations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
