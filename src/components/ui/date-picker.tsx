'use client'

import { useState } from 'react'
import { format, parse, isValid } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  // Selected date as an ISO calendar string (yyyy-MM-dd).
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disableFuture?: boolean
  disablePast?: boolean
  id?: string
  className?: string
}

function parseValue(value?: string): Date | undefined {
  if (!value) return undefined
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  return isValid(parsed) ? parsed : undefined
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disableFuture = false,
  disablePast = false,
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseValue(value)

  const disabled = disableFuture
    ? { after: new Date() }
    : disablePast
      ? { before: new Date() }
      : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            id={id}
            variant="outline"
            className={className ?? 'w-full justify-start font-normal data-[empty=true]:text-muted-foreground'}
            data-empty={!selected}
            data-icon="inline-start"
          />
        }
      >
        <CalendarIcon className="h-4 w-4" />
        {selected ? format(selected, 'dd MMM yyyy') : placeholder}
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, 'yyyy-MM-dd') : '')
            setOpen(false)
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
