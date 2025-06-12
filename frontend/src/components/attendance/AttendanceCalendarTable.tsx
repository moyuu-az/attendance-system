'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatTimeJST, formatDateJST } from '@/lib/timezone'
import { EditAttendanceDialog } from '@/components/forms/EditAttendanceDialog'
import type { MonthlyCalendar, CalendarDay } from '@/types'

interface AttendanceCalendarTableProps {
  selectedMonth: { year: number; month: number }
  onMonthChange: (month: { year: number; month: number }) => void
  monthlyCalendar?: MonthlyCalendar
  isLoading: boolean
}

export function AttendanceCalendarTable({
  selectedMonth,
  onMonthChange,
  monthlyCalendar,
  isLoading
}: AttendanceCalendarTableProps) {
  const [editingAttendance, setEditingAttendance] = useState<CalendarDay | null>(null)

  const handlePrevMonth = () => {
    const prevMonth = selectedMonth.month === 1 ? 12 : selectedMonth.month - 1
    const prevYear = selectedMonth.month === 1 ? selectedMonth.year - 1 : selectedMonth.year
    onMonthChange({ year: prevYear, month: prevMonth })
  }

  const handleNextMonth = () => {
    const nextMonth = selectedMonth.month === 12 ? 1 : selectedMonth.month + 1
    const nextYear = selectedMonth.month === 12 ? selectedMonth.year + 1 : selectedMonth.year
    onMonthChange({ year: nextYear, month: nextMonth })
  }

  const getStatusBadge = (day: CalendarDay) => {
    switch (day.status) {
      case 'present':
        return <Badge variant="default" className="bg-green-100 text-green-800">出勤</Badge>
      case 'absent':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">欠勤</Badge>
      case 'weekend':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">土日</Badge>
      case 'holiday':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">祝日</Badge>
      default:
        return <Badge variant="secondary">不明</Badge>
    }
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--'
    return formatTimeJST(`2000-01-01T${timeStr}`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>勤怠記録</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="text-muted-foreground">データを読み込み中...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>勤怠記録</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-medium px-4">
                {format(new Date(selectedMonth.year, selectedMonth.month - 1), 'yyyy年M月', { locale: ja })}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            月別の勤怠記録を確認・編集できます
          </p>
        </CardHeader>
        <CardContent>
          {monthlyCalendar?.calendar_days ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">日付</th>
                    <th className="text-left p-3 font-medium">曜日</th>
                    <th className="text-left p-3 font-medium">ステータス</th>
                    <th className="text-left p-3 font-medium">出勤時刻</th>
                    <th className="text-left p-3 font-medium">退勤時刻</th>
                    <th className="text-left p-3 font-medium">労働時間</th>
                    <th className="text-left p-3 font-medium">休憩時間</th>
                    <th className="text-left p-3 font-medium">給与</th>
                    <th className="text-left p-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyCalendar.calendar_days.map((day) => {
                    const breakDuration = day.attendance?.break_times?.reduce(
                      (total, breakTime) => total + (breakTime.duration || 0), 
                      0
                    ) || 0
                    
                    return (
                      <tr 
                        key={day.date} 
                        className={`border-b hover:bg-muted/50 ${
                          day.is_weekend ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-medium">
                            {format(new Date(day.date), 'd日', { locale: ja })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(day.date), 'M/d', { locale: ja })}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={day.is_weekend ? 'text-blue-600 font-medium' : ''}>
                            {format(new Date(day.date), 'E', { locale: ja })}
                          </span>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(day)}
                        </td>
                        <td className="p-3 font-mono">
                          {formatTime(day.attendance?.clock_in || null)}
                        </td>
                        <td className="p-3 font-mono">
                          {formatTime(day.attendance?.clock_out || null)}
                        </td>
                        <td className="p-3 font-mono">
                          {day.attendance?.total_hours ? 
                            `${day.attendance.total_hours}h` : '--:--'}
                        </td>
                        <td className="p-3 font-mono">
                          {breakDuration > 0 ? `${breakDuration}分` : '--'}
                        </td>
                        <td className="p-3">
                          {day.attendance?.total_amount ? 
                            `¥${day.attendance.total_amount.toLocaleString()}` : '¥0'}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAttendance(day)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {selectedMonth.year}年{selectedMonth.month}月の勤怠記録はありません
            </div>
          )}
        </CardContent>
      </Card>

      {editingAttendance && (
        <EditAttendanceDialog
          attendance={editingAttendance.attendance}
          date={editingAttendance.date}
          open={!!editingAttendance}
          onOpenChange={(open) => !open && setEditingAttendance(null)}
        />
      )}
    </>
  )
}