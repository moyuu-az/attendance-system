import { create } from 'zustand'
import { userApi } from '@/lib/api'
import type { User } from '@/types'
import { toast } from '@/hooks/use-toast'

interface UserState {
  currentUser: User | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCurrentUser: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  updateHourlyRate: (hourlyRate: number) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isLoading: false,
  error: null,
  
  fetchCurrentUser: async () => {
    console.log('userStore.fetchCurrentUser - starting...')
    set({ isLoading: true, error: null })
    try {
      console.log('userStore.fetchCurrentUser - calling userApi.getMe()')
      const user = await userApi.getMe()
      console.log('userStore.fetchCurrentUser - got user:', user)
      set({ currentUser: user })
    } catch (error) {
      console.error('userStore.fetchCurrentUser - error:', error)
      set({ error: 'ユーザー情報の取得に失敗しました' })
    } finally {
      set({ isLoading: false })
      console.log('userStore.fetchCurrentUser - completed')
    }
  },
  
  updateUser: async (userData) => {
    set({ isLoading: true, error: null })
    try {
      const updatedUser = await userApi.updateMe(userData)
      set({ currentUser: updatedUser })
      toast({
        title: 'ユーザー情報を更新しました',
      })
    } catch (error) {
      set({ error: 'ユーザー情報の更新に失敗しました' })
      toast({
        title: 'エラー',
        description: 'ユーザー情報の更新に失敗しました',
        variant: 'destructive',
      })
      console.error('Failed to update user:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  updateHourlyRate: async (hourlyRate) => {
    set({ isLoading: true, error: null })
    try {
      const updatedUser = await userApi.updateHourlyRate(hourlyRate)
      set({ currentUser: updatedUser })
      toast({
        title: '時給を更新しました',
        description: `新しい時給: ¥${hourlyRate.toLocaleString()}/時間`,
      })
    } catch (error) {
      set({ error: '時給の更新に失敗しました' })
      toast({
        title: 'エラー',
        description: '時給の更新に失敗しました',
        variant: 'destructive',
      })
      console.error('Failed to update hourly rate:', error)
    } finally {
      set({ isLoading: false })
    }
  },
}))