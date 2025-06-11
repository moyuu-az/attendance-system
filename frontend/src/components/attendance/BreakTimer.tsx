'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAttendanceStore } from '@/lib/stores/attendance'
import { Coffee, Play, Pause } from 'lucide-react'
import { format } from 'date-fns'

interface BreakTimerProps {
  attendanceId: number
}

export function BreakTimer({ attendanceId }: BreakTimerProps) {
  const { todayAttendance, startBreak, endBreak } = useAttendanceStore()
  const [elapsedTime, setElapsedTime] = useState(0)
  
  const activeBreak = todayAttendance?.break_times?.find(b => !b.end_time)
  const isOnBreak = !!activeBreak

  useEffect(() => {
    if (!isOnBreak) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      if (activeBreak?.start_time) {
        const start = new Date(`1970-01-01T${activeBreak.start_time}`)
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
        setElapsedTime(elapsed)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isOnBreak, activeBreak])

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleBreakToggle = async () => {
    if (isOnBreak && activeBreak) {
      await endBreak(activeBreak.id)
    } else {
      await startBreak()
    }
  }

  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coffee className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium">休憩時間</p>
              {isOnBreak && (
                <p className="text-2xl font-bold font-mono">
                  {formatElapsedTime(elapsedTime)}
                </p>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleBreakToggle}
            variant={isOnBreak ? "destructive" : "outline"}
            size="sm"
          >
            {isOnBreak ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                休憩終了
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                休憩開始
              </>
            )}
          </Button>
        </div>

        {/* 本日の休憩履歴 */}
        {todayAttendance?.break_times && todayAttendance.break_times.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">本日の休憩履歴</p>
            {todayAttendance.break_times
              .filter(b => b.end_time)
              .map((breakTime, index) => (
                <div key={breakTime.id} className="text-sm text-gray-700">
                  {index + 1}. {breakTime.start_time} - {breakTime.end_time} 
                  ({breakTime.duration}分)
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}