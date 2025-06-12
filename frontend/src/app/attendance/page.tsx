'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AttendanceCalendarTable } from '@/components/attendance/AttendanceCalendarTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Clock, DollarSign, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAttendance } from '@/hooks/useAttendance';

export default function AttendancePage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });

  const { monthlyReport, monthlyCalendar, isLoading } = useAttendance({
    year: selectedMonth.year,
    month: selectedMonth.month,
  });

  return (
    <Layout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">勤怠一覧</h1>
        <p className="text-muted-foreground mt-2">
          月別の勤怠記録を確認・編集できます
        </p>
      </div>

      {/* 月次サマリーカード */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">営業日数</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyCalendar?.total_working_days || 0}日
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(selectedMonth.year, selectedMonth.month - 1), 'yyyy年M月', { locale: ja })}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">出勤日数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyCalendar?.total_present_days || 0}日
            </div>
            <p className="text-xs text-muted-foreground">
              営業日の{monthlyCalendar?.total_working_days || 0}日中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">出勤率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyCalendar?.attendance_rate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              平均出勤率
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総勤務時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyCalendar?.total_hours || 0}時間
            </div>
            <p className="text-xs text-muted-foreground">
              平均 {monthlyReport?.average_daily_hours || 0}時間/日
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">給与総額</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{(monthlyCalendar?.total_amount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              時給 ¥{monthlyReport?.hourly_rate || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 勤怠カレンダーテーブル */}
      <AttendanceCalendarTable 
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        monthlyCalendar={monthlyCalendar}
        isLoading={isLoading}
      />
      </div>
    </Layout>
  );
}