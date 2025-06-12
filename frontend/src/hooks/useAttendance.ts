import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceWithBreaks, MonthlyReport, MonthlyCalendar } from '@/types';
import { attendanceApi, reportApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseAttendanceParams {
  year: number;
  month: number;
}

export function useAttendance({ year, month }: UseAttendanceParams) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 月次勤怠データ取得
  const attendanceQuery = useQuery<AttendanceWithBreaks[]>({
    queryKey: ['attendance', year, month],
    queryFn: () => attendanceApi.getList({ userId: 1, year, month }),
  });

  // 月次レポート取得
  const monthlyReportQuery = useQuery<MonthlyReport>({
    queryKey: ['monthlyReport', year, month],
    queryFn: () => reportApi.getMonthly(1, year, month),
  });

  // 月次カレンダー取得
  const monthlyCalendarQuery = useQuery<MonthlyCalendar>({
    queryKey: ['monthlyCalendar', year, month],
    queryFn: () => attendanceApi.getCalendar({ userId: 1, year, month }),
  });

  // 勤怠更新
  const updateAttendance = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AttendanceWithBreaks> }) => 
      attendanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', year, month] });
      queryClient.invalidateQueries({ queryKey: ['monthlyReport', year, month] });
      queryClient.invalidateQueries({ queryKey: ['monthlyCalendar', year, month] });
      toast({
        title: '更新完了',
        description: '勤怠情報を更新しました',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'エラー',
        description: error.response?.data?.detail || '更新に失敗しました',
        variant: 'destructive',
      });
    },
  });

  // 勤怠削除
  const deleteAttendance = useMutation({
    mutationFn: (id: number) => attendanceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', year, month] });
      queryClient.invalidateQueries({ queryKey: ['monthlyReport', year, month] });
      queryClient.invalidateQueries({ queryKey: ['monthlyCalendar', year, month] });
      toast({
        title: '削除完了',
        description: '勤怠情報を削除しました',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'エラー',
        description: error.response?.data?.detail || '削除に失敗しました',
        variant: 'destructive',
      });
    },
  });

  return {
    attendanceList: attendanceQuery.data,
    monthlyReport: monthlyReportQuery.data,
    monthlyCalendar: monthlyCalendarQuery.data,
    isLoading: attendanceQuery.isLoading || monthlyReportQuery.isLoading || monthlyCalendarQuery.isLoading,
    isError: attendanceQuery.isError || monthlyReportQuery.isError || monthlyCalendarQuery.isError,
    updateAttendance,
    deleteAttendance,
  };
}