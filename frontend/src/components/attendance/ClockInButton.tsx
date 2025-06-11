'use client'

import { Button } from '@/components/ui/button'
import { useAttendanceStore } from '@/lib/stores/attendance'
import { LogIn } from 'lucide-react'

interface ClockInButtonProps {
  disabled?: boolean
  isLoading?: boolean
}

export function ClockInButton({ disabled, isLoading }: ClockInButtonProps) {
  const { clockIn } = useAttendanceStore()

  return (
    <Button
      onClick={clockIn}
      disabled={disabled || isLoading}
      size="lg"
      className="flex-1"
    >
      <LogIn className="mr-2 h-4 w-4" />
      出勤
    </Button>
  )
}