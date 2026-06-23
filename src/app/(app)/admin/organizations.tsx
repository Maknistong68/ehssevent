'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Building2, Loader2 } from 'lucide-react'
import { createOrganization } from '@/lib/actions/admin'
import type { Organization } from '@/types/database'
import type { OrgType } from '@/types/enums'
import { toast } from 'sonner'

interface AdminOrganizationsProps {
  organizations: Organization[]
}

export function AdminOrganizations({ organizations }: AdminOrganizationsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [orgType, setOrgType] = useState<OrgType>('client')
  const [contactEmail, setContactEmail] = useState('')
  const router = useRouter()

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    setLoading(true)
    const result = await createOrganization({
      name,
      org_type: orgType,
      contact_email: contactEmail || undefined,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Organization created')
      setOpen(false)
      setName('')
      setContactEmail('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Organization name"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={orgType}
                  onValueChange={(v) => v && setOrgType(v as OrgType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@company.com"
                  type="email"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {organizations.map((org, i) => (
          <Card
            key={org.id}
            size="sm"
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand-green-soft">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{org.name}</p>
                  {org.contact_email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {org.contact_email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant={org.org_type === 'client' ? 'default' : 'secondary'}
                >
                  {org.org_type}
                </Badge>
                {!org.is_active && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
