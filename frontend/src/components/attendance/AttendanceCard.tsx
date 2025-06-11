'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceWithBreaks } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Clock, Calendar, DollarSign, Coffee } from 'lucide-react'

interface AttendanceCardProps {
  attendance: AttendanceWithBreaks
  showDate?: boolean
}

export function AttendanceCard({ attendance, showDate = true }: AttendanceCardProps) {
  const totalBreakMinutes = attendance.break_times?.reduce(
    (sum, b) => sum + (b.duration || 0), 
    0
  ) || 0
  const breakHours = Math.floor(totalBreakMinutes / 60)
  const breakMinutes = totalBreakMinutes % 60

  return (
    <Card className="card-shadow hover:card-shadow-hover transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {showDate && (
            <span className="text-lg">
              {format(new Date(attendance.date), 'MM月dd日 (E)', { locale: ja })}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            ID: {attendance.id}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">出勤</p>
              <p className="font-medium">{attendance.clock_in || '--:--'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">退勤</p>
              <p className="font-medium">{attendance.clock_out || '--:--'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">労働時間</p>
              <p className="font-medium">
                {attendance.total_hours ? `${attendance.total_hours}時間` : '--'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">給与</p>
              <p className="font-medium">
                ¥{attendance.total_amount?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* 休憩時間の表示 */}
        {attendance.break_times && attendance.break_times.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                休憩時間: {breakHours}時間{breakMinutes}分
              </p>
            </div>
            <div className="space-y-1">
              {attendance.break_times.map((breakTime, index) => (
                <p key={breakTime.id} className="text-sm text-muted-foreground">
                  {index + 1}. {breakTime.start_time} - {breakTime.end_time || '進行中'} 
                  {breakTime.duration && ` (${breakTime.duration}分)`}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}