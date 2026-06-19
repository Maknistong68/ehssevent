'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Plus, Trash2, Loader2 } from 'lucide-react'
import {
  addContractorToProject,
  removeContractorFromProject,
} from '@/lib/actions/projects'
import type { Organization, ProjectContractor } from '@/types/database'
import { toast } from 'sonner'

interface ContractorManagerProps {
  projectId: string
  currentContractors: ProjectContractor[]
  allContractors: Organization[]
}

export function ContractorManager({
  projectId,
  currentContractors,
  allContractors,
}: ContractorManagerProps) {
  const [selectedId, setSelectedId] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState<string | null>(null)
  const router = useRouter()

  const assignedIds = new Set(currentContractors.map((c) => c.contractor_org_id))
  const available = allContractors.filter((c) => !assignedIds.has(c.id))

  const handleAdd = async () => {
    if (!selectedId) return
    setAddLoading(true)

    const result = await addContractorToProject(projectId, selectedId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Contractor added')
      setSelectedId('')
      router.refresh()
    }
    setAddLoading(false)
  }

  const handleRemove = async (contractorOrgId: string) => {
    setRemoveLoading(contractorOrgId)

    const result = await removeContractorFromProject(projectId, contractorOrgId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Contractor removed')
      router.refresh()
    }
    setRemoveLoading(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Contractors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentContractors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No contractors assigned yet.
          </p>
        ) : (
          <div className="space-y-2">
            {currentContractors.map((pc) => {
              const org = pc.contractor_organization as
                | { id: string; name: string; contact_email?: string }
                | undefined
              return (
                <div
                  key={pc.contractor_org_id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{org?.name || 'Unknown'}</p>
                    {org?.contact_email && (
                      <p className="text-xs text-muted-foreground">
                        {org.contact_email}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(pc.contractor_org_id)}
                    disabled={removeLoading === pc.contractor_org_id}
                  >
                    {removeLoading === pc.contractor_org_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {available.length > 0 && (
          <div className="flex gap-2">
            <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? '')}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a contractor" />
              </SelectTrigger>
              <SelectContent>
                {available.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!selectedId || addLoading}>
              {addLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
