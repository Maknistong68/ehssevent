'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { toSecurePhotoUrl } from '@/lib/utils/photo-url'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface PhotoGridProps {
  photos: string[]
  thumbClassName?: string
}

/**
 * Renders a grid of photo thumbnails. Clicking a thumbnail opens a dialog
 * showing the full-size image.
 */
export function PhotoGrid({ photos, thumbClassName }: PhotoGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {photos.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className={cn(
              'relative h-24 w-24 overflow-hidden rounded-md border transition-opacity hover:opacity-90',
              thumbClassName
            )}
          >
            <Image
              src={toSecurePhotoUrl(url)}
              alt={`Photo ${i + 1}`}
              fill
              unoptimized
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={openIndex !== null}
        onOpenChange={(open) => !open && setOpenIndex(null)}
      >
        <DialogContent className="max-w-3xl sm:max-w-3xl">
          <DialogTitle className="sr-only">
            {openIndex !== null ? `Photo ${openIndex + 1}` : 'Photo'}
          </DialogTitle>
          {openIndex !== null && (
            <div className="relative mx-auto h-[70vh] w-full">
              <Image
                src={toSecurePhotoUrl(photos[openIndex])}
                alt={`Photo ${openIndex + 1}`}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
