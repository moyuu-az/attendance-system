'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAttendanceStore } from '@/lib/stores/attendance'
import { Coffee, Play, Pause } from 'lucide-react'
import { calculateElapsedTimeJST, formatElapsedTime, todayJST } from '@/lib/timezone'

interface BreakTimerProps {
  attendanceId: number
}

export function BreakTimer({ attendanceId }: BreakTimerProps) {
  // TODO: Use attendanceId for more specific break handling
  void attendanceId;
  const { 
    todayAttendance, 
    startBreak, 
    endBreak, 
    isBreakLoading,
    breakError,
    clearBreakError 
  } = useAttendanceStore()
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
        const elapsed = calculateElapsedTimeJST(activeBreak.start_time, todayJST())
        setElapsedTime(elapsed)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isOnBreak, activeBreak])

  // エラー自動クリア
  useEffect(() => {
    if (breakError) {
      const timer = setTimeout(() => {
        clearBreakError()
      }, 5000) // 5秒後にエラーをクリア
      return () => clearTimeout(timer)
    }
  }, [breakError, clearBreakError])


  const handleBreakToggle = async () => {
    if (isBreakLoading) return // 連続クリック防止
    
    try {
      if (isOnBreak && activeBreak) {
        await endBreak(activeBreak.id)
      } else {
        await startBreak()
      }
    } catch (error) {
      console.error('Break operation failed:', error)
    }
  }

  // 出勤状態の確認
  const canUseBreak = todayAttendance?.clock_in && !todayAttendance?.clock_out

  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        {/* エラー表示 */}
        {breakError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {breakError}
          </div>
        )}
        
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
              {!canUseBreak && (
                <p className="text-xs text-gray-500">
                  {!todayAttendance?.clock_in ? '出勤してから利用できます' : '退勤済みです'}
                </p>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleBreakToggle}
            variant={isOnBreak ? "destructive" : "outline"}
            size="sm"
            disabled={!canUseBreak || isBreakLoading}
          >
            {isBreakLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                処理中...
              </>
            ) : isOnBreak ? (
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
                <div key={breakTime.id} className="text-sm text-gray-700 flex justify-between">
                  <span>{index + 1}. {breakTime.start_time} - {breakTime.end_time}</span>
                  <span className="font-mono text-gray-600">({breakTime.duration}分)</span>
                </div>
              ))}
            
            {/* 進行中の休憩がある場合の表示 */}
            {activeBreak && (
              <div className="text-sm text-blue-600 flex justify-between bg-blue-50 p-2 rounded">
                <span>進行中: {activeBreak.start_time} - </span>
                <span className="font-mono">({Math.floor(elapsedTime / 60)}分)</span>
              </div>
            )}
            
            {/* 合計休憩時間 */}
            {todayAttendance.break_times.filter(b => b.end_time).length > 0 && (
              <div className="text-sm font-semibold text-gray-700 border-t pt-2">
                合計休憩時間: {todayAttendance.break_times
                  .filter(b => b.end_time)
                  .reduce((total, b) => total + b.duration, 0)}分
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}