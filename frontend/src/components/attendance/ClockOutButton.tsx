'use client'

import { Button } from '@/components/ui/button'
import { useAttendanceStore } from '@/lib/stores/attendance'
import { LogOut } from 'lucide-react'

interface ClockOutButtonProps {
  disabled?: boolean
  isLoading?: boolean
}

export function ClockOutButton({ disabled, isLoading }: ClockOutButtonProps) {
  const { clockOut } = useAttendanceStore()

  return (
    <Button
      onClick={clockOut}
      disabled={disabled || isLoading}
      size="lg"
      variant="secondary"
      className="flex-1"
    >
      <LogOut className="mr-2 h-4 w-4" />
      退勤
    </Button>
  )
}