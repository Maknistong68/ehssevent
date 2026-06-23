import {
  MOCK_PROJECTS,
  MOCK_PROJECT_CONTRACTORS,
  MOCK_ORGANIZATIONS,
  MOCK_PROFILES,
} from '@/lib/mock-data'
import type {
  Project,
  Organization,
  Profile,
  ProjectContractor,
} from '@/types/database'

export async function getProjects(): Promise<Project[]> {
  return MOCK_PROJECTS.filter((p) => p.is_active)
}

export async function getProjectById(id: string): Promise<Project | null> {
  return MOCK_PROJECTS.find((p) => p.id === id) ?? null
}

export async function getProjectContractors(
  projectId: string
): Promise<ProjectContractor[]> {
  return MOCK_PROJECT_CONTRACTORS.filter((pc) => pc.project_id === projectId)
}

export async function getContractorOrganizations(): Promise<Organization[]> {
  return MOCK_ORGANIZATIONS.filter(
    (o) => o.org_type === 'contractor' && o.is_active
  )
}

export async function getOrganizationUsers(orgId: string): Promise<Profile[]> {
  return MOCK_PROFILES.filter(
    (p) => p.organization_id === orgId && p.status === 'active'
  )
}
