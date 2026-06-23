export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAllOrganizations, getAllProfiles } from '@/lib/queries/admin'
import { getAuditLogs } from '@/lib/queries/audit'
import { getDsrRequests } from '@/lib/queries/dsr'
import { requireAdmin } from '@/lib/auth/guards'
import { AdminOrganizations } from './organizations'
import { AdminUsers } from './users'
import { AuditLog } from './audit-log'
import { DsrQueue } from './dsr-queue'
import { PermissionMatrix } from './permission-matrix'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata = {
  title: 'Admin - Event Report',
}

export default async function AdminPage() {
  const auth = await requireAdmin()
  if (!auth.ok) redirect('/dashboard')

  const [organizations, profiles, auditLogs, dsrRequests] = await Promise.all([
    getAllOrganizations(),
    getAllProfiles(),
    getAuditLogs(500),
    getDsrRequests(),
  ])

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
          Admin Panel
        </h1>
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
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="dsr">DSR ({dsrRequests.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="mt-4">
          <AdminOrganizations organizations={organizations} />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <AdminUsers
            profiles={profiles}
            organizations={organizations}
            currentUserId={auth.profile.id}
          />
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <PermissionMatrix />
        </TabsContent>

        <TabsContent value="dsr" className="mt-4">
          <DsrQueue requests={dsrRequests} />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLog entries={auditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
