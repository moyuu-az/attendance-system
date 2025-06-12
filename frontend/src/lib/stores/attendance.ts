import { create } from 'zustand'
import { attendanceApi, breakApi } from '@/lib/api'
import type { AttendanceWithBreaks } from '@/types'
import { toast } from '@/hooks/use-toast'

interface AttendanceState {
  todayAttendance: AttendanceWithBreaks | null
  attendances: AttendanceWithBreaks[]
  isLoading: boolean
  isBreakLoading: boolean
  error: string | null
  breakError: string | null
  
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
  
  // Error clearing
  clearError: () => void
  clearBreakError: () => void
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  todayAttendance: null,
  attendances: [],
  isLoading: false,
  isBreakLoading: false,
  error: null,
  breakError: null,
  
  fetchTodayAttendance: async () => {
    set({ isLoading: true, error: null })
    try {
      const attendance = await attendanceApi.getToday(1) // TODO: 実際のユーザーIDを使用
      console.log('fetchTodayAttendance - response:', attendance)
      if (attendance?.break_times) {
        console.log('fetchTodayAttendance - break_times:', attendance.break_times)
      }
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
    const { todayAttendance, isBreakLoading } = get()
    
    if (!todayAttendance) {
      const errorMsg = '勤怠記録が見つかりません。先に出勤してください。'
      set({ breakError: errorMsg })
      toast({
        title: 'エラー',
        description: errorMsg,
        variant: 'destructive',
      })
      return
    }
    
    if (isBreakLoading) {
      console.log('Break operation already in progress')
      return
    }
    
    // 既に休憩中かチェック
    const activeBreak = todayAttendance.break_times?.find(b => !b.end_time)
    if (activeBreak) {
      const errorMsg = '既に休憩中です。'
      set({ breakError: errorMsg })
      toast({
        title: 'エラー',
        description: errorMsg,
        variant: 'destructive',
      })
      return
    }
    
    set({ isBreakLoading: true, breakError: null })
    try {
      const breakTime = await breakApi.start(todayAttendance.id)
      console.log('startBreak - response:', breakTime)
      await get().fetchTodayAttendance()
      toast({
        title: '休憩を開始しました',
        description: `開始時刻: ${breakTime.start_time}`,
      })
    } catch (error: any) {
      const errorData = error?.response?.data?.detail
      let errorMsg = '休憩開始処理に失敗しました'
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (errorData.message) {
          errorMsg = errorData.message
        }
      }
      
      set({ breakError: errorMsg })
      toast({
        title: 'エラー',
        description: errorMsg,
        variant: 'destructive',
      })
      console.error('Failed to start break:', error)
    } finally {
      set({ isBreakLoading: false })
    }
  },
  
  endBreak: async (breakId: number) => {
    const { isBreakLoading } = get()
    
    if (isBreakLoading) {
      console.log('Break operation already in progress')
      return
    }
    
    if (!breakId || breakId <= 0) {
      const errorMsg = '無効な休憩IDです。'
      set({ breakError: errorMsg })
      toast({
        title: 'エラー',
        description: errorMsg,
        variant: 'destructive',
      })
      return
    }
    
    set({ isBreakLoading: true, breakError: null })
    try {
      const breakTime = await breakApi.end(breakId)
      console.log('endBreak - response:', breakTime)
      await get().fetchTodayAttendance()
      toast({
        title: '休憩を終了しました',
        description: `終了時刻: ${breakTime.end_time} (休憩時間: ${breakTime.duration}分)`,
      })
    } catch (error: any) {
      const errorData = error?.response?.data?.detail
      let errorMsg = '休憩終了処理に失敗しました'
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (errorData.message) {
          errorMsg = errorData.message
        }
      }
      
      set({ breakError: errorMsg })
      toast({
        title: 'エラー',
        description: errorMsg,
        variant: 'destructive',
      })
      console.error('Failed to end break:', error)
    } finally {
      set({ isBreakLoading: false })
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
  
  // Error clearing functions
  clearError: () => {
    set({ error: null })
  },
  
  clearBreakError: () => {
    set({ breakError: null })
  },
}))