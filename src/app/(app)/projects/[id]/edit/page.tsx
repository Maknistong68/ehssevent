export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getProjectById } from '@/lib/queries/projects'
import { Button } from '@/components/ui/button'
import { EditProjectForm } from './form'

export const metadata = {
  title: 'Edit Project - Event Report',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const project = await getProjectById(id)

  if (!project) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <Link href={`/projects/${id}`}>
        <Button variant="ghost" size="sm" data-icon="inline-start">
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Button>
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Edit Project
      </h1>
      <EditProjectForm project={project} />
    </div>
  )
}
