'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUpIcon, BarChart3Icon } from 'lucide-react'
import type { MonthlyReport, YearlyReport } from '@/types'

/**
 * レポート用チャートコンポーネント
 * 
 * 月次・年次レポートデータをグラフィカルに表示する。
 * 月別労働時間の推移や年間実績の可視化を提供する。
 */
interface ChartsProps {
  monthlyReport?: MonthlyReport
  yearlyReport?: YearlyReport
  type: 'monthly' | 'yearly'
}

export function Charts({ monthlyReport, yearlyReport, type }: ChartsProps) {
  /**
   * 月別出勤日数バーチャート（年次レポート用）
   */
  const renderMonthlyAttendanceChart = () => {
    if (!yearlyReport?.monthly_summary?.length) return null

    const maxDays = Math.max(...yearlyReport.monthly_summary.map(m => m.total_days))
    
    return (
      <div className="space-y-3">
        {yearlyReport.monthly_summary.map((monthData) => {
          const percentage = maxDays > 0 ? (monthData.total_days / maxDays) * 100 : 0
          
          return (
            <div key={monthData.month} className="flex items-center gap-3">
              <div className="w-8 text-sm font-medium text-right">
                {monthData.month}月
              </div>
              <div className="flex-1 relative">
                <div className="h-6 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                  {monthData.total_days}日
                </div>
              </div>
              <div className="w-16 text-sm text-muted-foreground text-right">
                {Math.round(percentage)}%
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  /**
   * 月別労働時間バーチャート（年次レポート用）
   */
  const renderMonthlyHoursChart = () => {
    if (!yearlyReport?.monthly_summary?.length) return null

    const maxHours = Math.max(...yearlyReport.monthly_summary.map(m => Number(m.total_hours)))
    
    return (
      <div className="space-y-3">
        {yearlyReport.monthly_summary.map((monthData) => {
          const hours = Number(monthData.total_hours)
          const percentage = maxHours > 0 ? (hours / maxHours) * 100 : 0
          
          return (
            <div key={monthData.month} className="flex items-center gap-3">
              <div className="w-8 text-sm font-medium text-right">
                {monthData.month}月
              </div>
              <div className="flex-1 relative">
                <div className="h-6 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                  {hours}h
                </div>
              </div>
              <div className="w-16 text-sm text-muted-foreground text-right">
                {Math.round(percentage)}%
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  /**
   * 円グラフ（月次レポート用 - 労働時間vs標準時間）
   */
  const renderMonthlyPieChart = () => {
    if (!monthlyReport) return null

    const actualHours = Number(monthlyReport.total_hours)
    const standardHours = monthlyReport.total_days * 8 // 標準8時間/日
    const efficiency = standardHours > 0 ? (actualHours / standardHours) * 100 : 0
    
    // SVG円グラフの計算
    const radius = 60
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (efficiency / 100) * circumference

    return (
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            {/* 背景円 */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-secondary"
            />
            {/* プログレス円 */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(efficiency)}%
            </div>
            <div className="text-xs text-muted-foreground">効率</div>
          </div>
        </div>
        <div className="ml-6 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm">実働時間: {actualHours}h</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-sm">標準時間: {standardHours}h</span>
          </div>
        </div>
      </div>
    )
  }

  /**
   * 月次レポート表示
   */
  if (type === 'monthly' && monthlyReport) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              労働効率チャート
            </CardTitle>
            <CardDescription>
              標準労働時間（8時間/日）に対する実働時間の効率
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderMonthlyPieChart()}
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * 年次レポート表示
   */
  if (type === 'yearly' && yearlyReport) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 月別出勤日数チャート */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3Icon className="h-5 w-5" />
                月別出勤日数
              </CardTitle>
              <CardDescription>
                各月の出勤日数と最高出勤月との比較
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderMonthlyAttendanceChart()}
            </CardContent>
          </Card>

          {/* 月別労働時間チャート */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5" />
                月別労働時間
              </CardTitle>
              <CardDescription>
                各月の総労働時間と最高労働時間月との比較
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderMonthlyHoursChart()}
            </CardContent>
          </Card>
        </div>

        {/* 年間パフォーマンス要約 */}
        <Card>
          <CardHeader>
            <CardTitle>年間パフォーマンス要約</CardTitle>
            <CardDescription>
              {yearlyReport.year}年の労働パターン分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-primary">
                  {Math.round(Number(yearlyReport.total_hours) / yearlyReport.total_days * 10) / 10}
                </div>
                <div className="text-sm text-muted-foreground">平均労働時間/日</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  {Math.round(yearlyReport.total_days / 12 * 10) / 10}
                </div>
                <div className="text-sm text-muted-foreground">平均出勤日数/月</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-blue-600">
                  ¥{Math.round(Number(yearlyReport.total_amount) / yearlyReport.total_days).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">平均日給</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center text-muted-foreground">
          表示するデータがありません
        </div>
      </CardContent>
    </Card>
  )
}