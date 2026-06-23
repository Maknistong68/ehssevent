'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TimePickerProps {
  // Selected time as a 24-hour string (HH:mm).
  value?: string
  onChange: (value: string) => void
  minuteStep?: number
}

const pad = (n: number) => String(n).padStart(2, '0')

export function TimePicker({
  value = '',
  onChange,
  minuteStep = 5,
}: TimePickerProps) {
  const [hour = '', minute = ''] = value.split(':')

  const hours = Array.from({ length: 24 }, (_, i) => pad(i))
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) =>
    pad(i * minuteStep)
  )

  const update = (nextHour: string, nextMinute: string) => {
    if (!nextHour && !nextMinute) {
      onChange('')
      return
    }
    onChange(`${nextHour || '00'}:${nextMinute || '00'}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={hour || null}
        onValueChange={(v) => update(v ?? '', minute)}
      >
        <SelectTrigger className="w-full" aria-label="Hour">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        value={minute || null}
        onValueChange={(v) => update(hour, v ?? '')}
      >
        <SelectTrigger className="w-full" aria-label="Minute">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
