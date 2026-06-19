'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toSecurePhotoUrl } from '@/lib/utils/photo-url'
import Image from 'next/image'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface PhotoUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
  bucket?: string
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  bucket = 'observation-photos',
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')
    const newPhotos: string[] = []

    for (const file of Array.from(files)) {
      if (photos.length + newPhotos.length >= maxPhotos) break

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, WebP, and HEIC images are allowed')
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('Files must be under 10MB')
        continue
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file)

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(filePath)
        newPhotos.push(publicUrl)
      }
    }

    onPhotosChange([...photos, ...newPhotos])
    setUploading(false)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((url, i) => (
          <div key={i} className="relative h-20 w-20 rounded-md overflow-hidden border">
            <Image src={toSecurePhotoUrl(url)} alt={`Photo ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {photos.length < maxPhotos && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            capture="environment"
            onChange={handleUpload}
            className="hidden"
            id="photo-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Add Photo'}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            {photos.length}/{maxPhotos} photos
          </p>
        </div>
      )}
    </div>
  )
}
