'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarIcon, ClockIcon, DollarSignIcon, TrendingUpIcon, UserIcon } from 'lucide-react'
import { reportApi } from '@/lib/api'
import { formatTimeJST, toJST } from '@/lib/timezone'
import type { MonthlyReport } from '@/types'

/**
 * 月次レポート要約コンポーネント
 * 
 * 指定された年月の勤怠データから包括的な統計情報を表示し、
 * 詳細な勤怠記録リストも提供する。
 */
interface MonthlySummaryProps {
  userId?: number
}

export function MonthlySummary({ userId = 1 }: MonthlySummaryProps) {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)

  /**
   * 月次レポートデータ取得
   */
  const {
    data: monthlyReport,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['monthly-report', userId, selectedYear, selectedMonth],
    queryFn: () => reportApi.getMonthly(userId, selectedYear, selectedMonth),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  })

  /**
   * 年選択オプション生成（過去3年 + 未来1年）
   */
  const generateYearOptions = () => {
    const years = []
    const currentYear = new Date().getFullYear()
    for (let year = currentYear - 3; year <= currentYear + 1; year++) {
      years.push(year)
    }
    return years
  }

  /**
   * 月選択オプション生成
   */
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`
  }))

  /**
   * ステータスバッジコンポーネント
   */
  const getStatusBadge = (attendance: MonthlyReport['attendance_list'][0]) => {
    if (!attendance.clock_in) {
      return <Badge variant="secondary">未出勤</Badge>
    }
    if (!attendance.clock_out) {
      return <Badge variant="destructive">退勤記録なし</Badge>
    }
    if (attendance.total_hours >= 8) {
      return <Badge variant="default">通常勤務</Badge>
    }
    return <Badge variant="outline">短時間勤務</Badge>
  }

  /**
   * エラー表示
   */
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">エラーが発生しました</CardTitle>
          <CardDescription>
            月次レポートの取得に失敗しました。時間をおいて再試行してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            再試行
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 期間選択セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            月次レポート
          </CardTitle>
          <CardDescription>
            指定された月の勤怠実績と統計情報を表示します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="year-select" className="text-sm font-medium">
                年:
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger id="year-select" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateYearOptions().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="month-select" className="text-sm font-medium">
                月:
              </label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger id="month-select" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ローディング表示 */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">レポートを読み込み中...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 統計サマリーカード */}
      {monthlyReport && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 出勤日数 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">出勤日数</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyReport.total_days}日</div>
                <p className="text-xs text-muted-foreground">
                  {selectedYear}年{selectedMonth}月
                </p>
              </CardContent>
            </Card>

            {/* 総労働時間 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総労働時間</CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyReport.total_hours}時間</div>
                <p className="text-xs text-muted-foreground">
                  平均 {monthlyReport.average_daily_hours}時間/日
                </p>
              </CardContent>
            </Card>

            {/* 総支給額 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総支給額</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{monthlyReport.total_amount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  時給 ¥{monthlyReport.hourly_rate?.toLocaleString() || '1,000'}
                </p>
              </CardContent>
            </Card>

            {/* 効率指標 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">実働効率</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyReport.total_days > 0 
                    ? Math.round((monthlyReport.total_hours / (monthlyReport.total_days * 8)) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  標準8時間/日基準
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 詳細勤怠記録テーブル */}
          <Card>
            <CardHeader>
              <CardTitle>詳細勤怠記録</CardTitle>
              <CardDescription>
                {selectedYear}年{selectedMonth}月の日別勤怠詳細
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyReport.attendance_list.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  この期間の勤怠記録はありません
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">日付</th>
                        <th className="text-left py-3 px-4 font-medium">出勤時刻</th>
                        <th className="text-left py-3 px-4 font-medium">退勤時刻</th>
                        <th className="text-left py-3 px-4 font-medium">労働時間</th>
                        <th className="text-left py-3 px-4 font-medium">休憩回数</th>
                        <th className="text-left py-3 px-4 font-medium">支給額</th>
                        <th className="text-left py-3 px-4 font-medium">ステータス</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReport.attendance_list.map((attendance) => {
                        const attendanceDate = toJST(new Date(attendance.date))
                        const dayOfWeek = attendanceDate.getDay()
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        
                        return (
                          <tr 
                            key={attendance.id} 
                            className={`border-b hover:bg-muted/50 ${isWeekend ? 'bg-blue-50' : ''}`}
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium">
                                {attendanceDate.getMonth() + 1}/{attendanceDate.getDate()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]}曜日
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {attendance.clock_in ? (formatTimeJST(attendance.clock_in) || '-') : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {attendance.clock_out ? (formatTimeJST(attendance.clock_out) || '-') : '-'}
                            </td>
                            <td className="py-3 px-4 font-medium">
                              {attendance.total_hours}時間
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-center">
                                {attendance.break_times?.length || 0}回
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium">
                              ¥{attendance.total_amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(attendance)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}