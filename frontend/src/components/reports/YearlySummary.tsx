'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CalendarIcon, ClockIcon, DollarSignIcon, TrendingUpIcon, BarChart3Icon } from 'lucide-react'
import { reportApi } from '@/lib/api'
import type { YearlyReport } from '@/types'

/**
 * 年次レポート要約コンポーネント
 * 
 * 指定された年度の勤怠データから包括的な統計情報を表示し、
 * 月別詳細内訳も提供する。
 */
interface YearlySummaryProps {
  userId?: number
}

export function YearlySummary({ userId = 1 }: YearlySummaryProps) {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  /**
   * 年次レポートデータ取得
   */
  const {
    data: yearlyReport,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['yearly-report', userId, selectedYear],
    queryFn: () => reportApi.getYearly(userId, selectedYear),
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
  })

  /**
   * 年選択オプション生成（過去5年 + 現在年度）
   */
  const generateYearOptions = () => {
    const years = []
    const currentYear = new Date().getFullYear()
    for (let year = currentYear - 5; year <= currentYear; year++) {
      years.push(year)
    }
    return years
  }

  /**
   * 月名取得
   */
  const getMonthName = (month: number) => {
    return `${month}月`
  }

  /**
   * 最대労働時間を持つ月を검색
   */
  const getMaxHoursMonth = () => {
    if (!yearlyReport?.monthly_summary?.length) return null
    return yearlyReport.monthly_summary.reduce((max, current) => 
      current.total_hours > max.total_hours ? current : max
    )
  }

  /**
   * 平均월간労働時間계산
   */
  const calculateAverageMonthlyHours = () => {
    if (!yearlyReport?.monthly_summary?.length) return 0
    const totalHours = yearlyReport.monthly_summary.reduce((sum, month) => sum + Number(month.total_hours), 0)
    return Math.round((totalHours / yearlyReport.monthly_summary.length) * 100) / 100
  }

  /**
   * エラー表示
   */
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">エラーが발생했습니다</CardTitle>
          <CardDescription>
            년차レポートの取得に実패했습니다. 시간을おいて재시행해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            재시행
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 년도선택섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3Icon className="h-5 w-5" />
            년차レポート
          </CardTitle>
          <CardDescription>
            지정된년도의근태실적과통계정보를표시합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="year-select" className="text-sm font-medium">
                년도:
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger id="year-select" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateYearOptions().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 로딩표시 */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">레포트를읽어오는중...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 년간통계 summary카드 */}
      {yearlyReport && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 년간출근일수 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">년간출근일수</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{yearlyReport.total_days}일</div>
                <p className="text-xs text-muted-foreground">
                  {selectedYear}년 총계
                </p>
              </CardContent>
            </Card>

            {/* 년간총노동시간 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">년간총노동시간</CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{yearlyReport.total_hours}시간</div>
                <p className="text-xs text-muted-foreground">
                  월평균 {calculateAverageMonthlyHours()}시간
                </p>
              </CardContent>
            </Card>

            {/* 년간총지급액 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">년간총지급액</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{Number(yearlyReport.total_amount).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  월평균 ¥{Math.round(Number(yearlyReport.total_amount) / 12).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* 최고실적월 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">최고실적월</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getMaxHoursMonth() ? getMonthName(getMaxHoursMonth()!.month) : '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getMaxHoursMonth() ? `${getMaxHoursMonth()!.total_hours}시간` : '데이터없음'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 월별상세통계표 */}
          <Card>
            <CardHeader>
              <CardTitle>월별상세통계</CardTitle>
              <CardDescription>
                {selectedYear}년의월별근태실적상세
              </CardDescription>
            </CardHeader>
            <CardContent>
              {yearlyReport.monthly_summary.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  이기간의근태기록이없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  {yearlyReport.monthly_summary.map((monthData) => {
                    const monthHours = Number(monthData.total_hours)
                    const monthAmount = Number(monthData.total_amount)
                    const maxHours = Math.max(...yearlyReport.monthly_summary.map(m => Number(m.total_hours)))
                    const progressPercentage = maxHours > 0 ? (monthHours / maxHours) * 100 : 0
                    
                    return (
                      <div key={monthData.month} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              {getMonthName(monthData.month)}
                            </h3>
                            <div className="text-sm text-muted-foreground">
                              {monthData.total_days}일 출근
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {monthData.total_hours}시간
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ¥{monthAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>진행률</span>
                            <span>{Math.round(progressPercentage)}% (최고월대비)</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <div className="text-muted-foreground">출근일수</div>
                            <div className="font-medium">{monthData.total_days}일</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">평균일간시간</div>
                            <div className="font-medium">{monthData.average_daily_hours}시간</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">총노동시간</div>
                            <div className="font-medium">{monthData.total_hours}시간</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">월급여</div>
                            <div className="font-medium">¥{monthAmount.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 년간실적요약 */}
          <Card>
            <CardHeader>
              <CardTitle>년간실적요약</CardTitle>
              <CardDescription>
                {selectedYear}년의종합평가
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {yearlyReport.total_days}
                  </div>
                  <div className="text-sm text-muted-foreground">총출근일수</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    1년간의노동일수
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {yearlyReport.total_hours}
                  </div>
                  <div className="text-sm text-muted-foreground">총노동시간</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    평균 {calculateAverageMonthlyHours()}시간/월
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ¥{Math.round(Number(yearlyReport.total_amount) / 10000)}만
                  </div>
                  <div className="text-sm text-muted-foreground">년간총수입</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    월평균 ¥{Math.round(Number(yearlyReport.total_amount) / 12).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}