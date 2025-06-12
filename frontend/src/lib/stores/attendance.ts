import { create } from 'zustand'
import { attendanceApi, breakApi } from '@/lib/api'
import type { AttendanceWithBreaks } from '@/types'
import { toast } from '@/hooks/use-toast'

interface AttendanceState {
  todayAttendance: AttendanceWithBreaks | null
  attendances: AttendanceWithBreaks[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchTodayAttendance: () => Promise<void>
  fetchAttendances: (params: {
    year?: number
    month?: number
  }) => Promise<void>
  clockIn: () => Promise<void>
  clockOut: () => Promise<void>
  startBreak: () => Promise<void>
  endBreak: (breakId: number) => Promise<void>
  updateAttendance: (id: number, data: Partial<AttendanceWithBreaks>) => Promise<void>
  deleteAttendance: (id: number) => Promise<void>
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  todayAttendance: null,
  attendances: [],
  isLoading: false,
  error: null,
  
  fetchTodayAttendance: async () => {
    set({ isLoading: true, error: null })
    try {
      const attendance = await attendanceApi.getToday(1) // TODO: 実際のユーザーIDを使用
      set({ todayAttendance: attendance })
    } catch (error) {
      set({ error: '今日の勤怠情報の取得に失敗しました' })
      console.error('Failed to fetch today attendance:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  fetchAttendances: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const attendances = await attendanceApi.getList({
        userId: 1, // TODO: 実際のユーザーIDを使用
        ...params,
      })
      set({ attendances })
    } catch (error) {
      set({ error: '勤怠一覧の取得に失敗しました' })
      console.error('Failed to fetch attendances:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  clockIn: async () => {
    set({ isLoading: true, error: null })
    try {
      const attendance = await attendanceApi.clockIn(1) // TODO: 実際のユーザーIDを使用
      await get().fetchTodayAttendance()
      toast({
        title: '出勤しました',
        description: `出勤時刻: ${attendance.clock_in}`,
      })
    } catch (error) {
      set({ error: '出勤処理に失敗しました' })
      toast({
        title: 'エラー',
        description: '出勤処理に失敗しました',
        variant: 'destructive',
      })
      console.error('Failed to clock in:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  clockOut: async () => {
    set({ isLoading: true, error: null })
    try {
      const attendance = await attendanceApi.clockOut(1) // TODO: 実際のユーザーIDを使用
      await get().fetchTodayAttendance()
      toast({
        title: '退勤しました',
        description: `退勤時刻: ${attendance.clock_out}`,
      })
    } catch (error) {
      set({ error: '退勤処理に失敗しました' })
      toast({
        title: 'エラー',
        description: '退勤処理に失敗しました',
        variant: 'destructive',
      })
      console.error('Failed to clock out:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  startBreak: async () => {
    const { todayAttendance } = get()
    if (!todayAttendance) return
    
    set({ isLoading: true, error: null })
    try {
      const breakTime = await breakApi.start(todayAttendance.id)
      await get().fetchTodayAttendance()
      toast({
        title: '休憩を開始しました',
        description: `開始時刻: ${breakTime.start_time}`,
      })
    } catch (error) {
      set({ error: '休憩開始処理に失敗しました' })
      toast({
        title: 'エラー',
        description: '休憩開始処理に失敗しました',
        variant: 'destructive',
      })
      console.error('Failed to start break:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  endBreak: async (breakId: number) => {
    set({ isLoading: true, error: null })
    try {
      const breakTime = await breakApi.end(breakId)
      await get().fetchTodayAttendance()
      toast({
        title: '休憩を終了しました',
        description: `終了時刻: ${breakTime.end_time}`,
      })
    } catch (error) {
      set({ error: '休憩終了処理に失敗しました' })
      toast({
        title: 'エラー',
        description: '休憩終了処理に失敗しました',
        variant: 'destructive',
      })
      console.error('Failed to end break:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  updateAttendance: async (id: number, data: Partial<AttendanceWithBreaks>) => {
    set({ isLoading: true, error: null })
    try {
      await attendanceApi.update(id, data)
      await get().fetchAttendances({})
      toast({
        title: '勤怠情報を更新しました',
      })
    } catch (error) {
      set({ error: '勤怠情報の更新に失敗しました' })
      toast({
        title: 'エラー',
        description: '勤怠情報の更新に失敗しました',
        variant: 'destructive',
      })
      console.error('Failed to update attendance:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  deleteAttendance: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await attendanceApi.delete(id)
      await get().fetchAttendances({})
      toast({
        title: '勤怠記録を削除しました',
      })
    } catch (error) {
      set({ error: '勤怠記録の削除に失敗しました' })
      toast({
        title: 'エラー',
        description: '勤怠記録の削除に失敗しました',
        variant: 'destructive',
      })
      console.error('Failed to delete attendance:', error)
    } finally {
      set({ isLoading: false })
    }
  },
}))