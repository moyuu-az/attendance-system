import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceWithBreaks, MonthlyReport } from '@/types';
import { api } from '@/lib/api';
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
    queryFn: async () => {
      const response = await api.get('/attendance', {
        params: { year, month },
      });
      return response.data.data;
    },
  });

  // 月次レポート取得
  const monthlyReportQuery = useQuery<MonthlyReport>({
    queryKey: ['monthlyReport', year, month],
    queryFn: async () => {
      const response = await api.get('/reports/monthly', {
        params: { year, month },
      });
      return response.data.data;
    },
  });

  // 勤怠更新
  const updateAttendance = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AttendanceWithBreaks> }) => {
      const response = await api.put(`/attendance/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', year, month] });
      queryClient.invalidateQueries({ queryKey: ['monthlyReport', year, month] });
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
    mutationFn: async (id: number) => {
      const response = await api.delete(`/attendance/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', year, month] });
      queryClient.invalidateQueries({ queryKey: ['monthlyReport', year, month] });
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
    isLoading: attendanceQuery.isLoading || monthlyReportQuery.isLoading,
    isError: attendanceQuery.isError || monthlyReportQuery.isError,
    updateAttendance,
    deleteAttendance,
  };
}