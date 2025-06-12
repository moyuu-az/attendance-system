'use client'

import { useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ClockInButton } from '@/components/attendance/ClockInButton'
import { ClockOutButton } from '@/components/attendance/ClockOutButton'
import { BreakTimer } from '@/components/attendance/BreakTimer'
import { AttendanceCard } from '@/components/attendance/AttendanceCard'
import { useAttendanceStore } from '@/lib/stores/attendance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatTimeJST } from '@/lib/timezone'

export default function DashboardPage() {
  const { todayAttendance, fetchTodayAttendance, isLoading } = useAttendanceStore()

  useEffect(() => {
    fetchTodayAttendance()
  }, [fetchTodayAttendance])

  const today = new Date()

  return (
    <Layout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold google-font">ダッシュボード</h1>
          <p className="text-muted-foreground mt-2">
            {format(today, 'yyyy年MM月dd日 (EEEE)', { locale: ja })}
          </p>
        </div>

        {/* ステータスカード */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">出勤時刻</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayAttendance?.clock_in 
                  ? formatTimeJST(`2000-01-01T${todayAttendance.clock_in}`) 
                  : '--:--'}
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">労働時間</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayAttendance?.total_hours ? 
                  `${todayAttendance.total_hours}時間` : '--:--'}
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本日の給与</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{todayAttendance?.total_amount?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 勤怠操作エリア */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>勤怠管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* 出退勤ボタン */}
              <div className="flex gap-4">
                <ClockInButton 
                  disabled={!!todayAttendance?.clock_in}
                  isLoading={isLoading}
                />
                <ClockOutButton 
                  disabled={!todayAttendance?.clock_in || !!todayAttendance?.clock_out}
                  isLoading={isLoading}
                />
              </div>

              {/* 休憩タイマー */}
              {todayAttendance?.clock_in && !todayAttendance?.clock_out && (
                <BreakTimer attendanceId={todayAttendance.id} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 本日の勤怠詳細 */}
        {todayAttendance && (
          <AttendanceCard attendance={todayAttendance} showDate={false} />
        )}
      </div>
    </Layout>
  )
}