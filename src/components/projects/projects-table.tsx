import Link from 'next/link'
import { MapPin } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { SortHeader } from '@/components/shared/sort-header'
import type { Project } from '@/types/database'

export function ProjectsTable({ projects }: { projects: Project[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader sortKey="name">Name</SortHeader>
          <TableHead>Description</TableHead>
          <TableHead>Location</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} className="relative cursor-pointer">
            <TableCell className="whitespace-nowrap">
              <Link
                href={`/projects/${project.id}`}
                className="font-heading font-semibold tracking-tight text-foreground after:absolute after:inset-0"
              >
                {project.name}
              </Link>
            </TableCell>
            <TableCell className="max-w-[28rem] text-muted-foreground">
              <span className="line-clamp-1">{project.description || '—'}</span>
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {project.location ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {project.location}
                </span>
              ) : (
                '—'
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
