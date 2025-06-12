'use client'

import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3Icon, CalendarIcon, TrendingUpIcon } from 'lucide-react'
import { MonthlySummary } from '@/components/reports/MonthlySummary'
import { YearlySummary } from '@/components/reports/YearlySummary'
import { Charts } from '@/components/reports/Charts'
import { useQuery } from '@tanstack/react-query'
import { reportApi } from '@/lib/api'

/**
 * レポートページコンポーネント
 * 
 * 勤怠管理システムの包括的なレポート機能を提供する。
 * 月次・年次の統計情報とグラフィカルな可視化を統合したダッシュボード。
 */
export default function ReportsPage() {
  const currentDate = new Date()
  const [activeTab, setActiveTab] = useState('monthly')
  const userId = 1 // 固定（実際の実装では認証から取得）

  /**
   * 現在月のレポートデータ取得（Charts用）
   */
  const { data: currentMonthlyReport } = useQuery({
    queryKey: ['current-monthly-report', userId, currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () => reportApi.getMonthly(userId, currentDate.getFullYear(), currentDate.getMonth() + 1),
    enabled: activeTab === 'monthly',
  })

  /**
   * 現在年のレポートデータ取得（Charts用）
   */
  const { data: currentYearlyReport } = useQuery({
    queryKey: ['current-yearly-report', userId, currentDate.getFullYear()],
    queryFn: () => reportApi.getYearly(userId, currentDate.getFullYear()),
    enabled: activeTab === 'yearly',
  })

  return (
    <Layout>
      <div className="space-y-6">
        {/* ページヘッダー */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">レポート</h1>
          <p className="text-muted-foreground mt-2">
            勤怠実績の詳細分析と統計情報をご確認いただけます
          </p>
        </div>

      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の概要</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthlyReport?.total_days || 0}日
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthlyReport?.total_hours || 0}時間勤務
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の給与</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{Number(currentMonthlyReport?.total_amount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              時給¥{currentMonthlyReport?.hourly_rate?.toLocaleString() || '1,000'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">年間実績</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentYearlyReport?.total_days || 0}日
            </div>
            <p className="text-xs text-muted-foreground">
              ¥{Number(currentYearlyReport?.total_amount || 0).toLocaleString()} 年収
            </p>
          </CardContent>
        </Card>
      </div>

      {/* レポートタブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            月次レポート
          </TabsTrigger>
          <TabsTrigger value="yearly" className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            年次レポート
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4" />
            グラフ表示
          </TabsTrigger>
        </TabsList>

        {/* 月次レポートタブ */}
        <TabsContent value="monthly" className="space-y-6">
          <MonthlySummary userId={userId} />
        </TabsContent>

        {/* 年次レポートタブ */}
        <TabsContent value="yearly" className="space-y-6">
          <YearlySummary userId={userId} />
        </TabsContent>

        {/* グラフ表示タブ */}
        <TabsContent value="charts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5" />
                データ可視化
              </CardTitle>
              <CardDescription>
                勤怠データをグラフィカルに表示して、パフォーマンスや傾向を分析します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="monthly-chart" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="monthly-chart">月次チャート</TabsTrigger>
                  <TabsTrigger value="yearly-chart">年次チャート</TabsTrigger>
                </TabsList>
                
                <TabsContent value="monthly-chart">
                  <Charts 
                    type="monthly" 
                    monthlyReport={currentMonthlyReport} 
                  />
                </TabsContent>
                
                <TabsContent value="yearly-chart">
                  <Charts 
                    type="yearly" 
                    yearlyReport={currentYearlyReport} 
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 補足情報 */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="text-lg">レポート機能について</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • <strong>月次レポート</strong>: 指定した月の詳細な勤怠記録と統計情報を表示
          </p>
          <p className="text-sm text-muted-foreground">
            • <strong>年次レポート</strong>: 年間の総合実績と月別推移を表示
          </p>
          <p className="text-sm text-muted-foreground">
            • <strong>グラフ表示</strong>: データを視覚的に分析できるチャート機能
          </p>
          <p className="text-sm text-muted-foreground">
            • すべての時刻は日本標準時（JST）で表示されています
          </p>
        </CardContent>
      </Card>
      </div>
    </Layout>
  )
}