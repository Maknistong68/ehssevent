'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Archive, RotateCcw } from 'lucide-react'
import { toggleTemplateActive } from '@/lib/actions/inspections'
import { useRouter } from 'next/navigation'

interface ToggleTemplateButtonProps {
  templateId: string
  isActive: boolean
}

export function ToggleTemplateButton({ templateId, isActive }: ToggleTemplateButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    const result = await toggleTemplateActive(templateId)
    if (result?.error) {
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isActive ? (
        <Archive className="mr-2 h-4 w-4" />
      ) : (
        <RotateCcw className="mr-2 h-4 w-4" />
      )}
      {isActive ? 'Deactivate' : 'Reactivate'}
    </Button>
  )
}
