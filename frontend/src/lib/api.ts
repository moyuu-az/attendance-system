import axios from 'axios'
import type { 
  User, 
  Attendance, 
  AttendanceWithBreaks,
  BreakTime, 
  MonthlyReport, 
  YearlyReport 
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ユーザーAPI
export const userApi = {
  getMe: async (): Promise<User> => {
    try {
      console.log('userApi.getMe - making request to:', `${API_BASE_URL}/api/users/me`)
      const { data } = await api.get('/api/users/me')
      console.log('userApi.getMe - response:', data)
      return data
    } catch (error) {
      console.error('userApi.getMe - error:', error)
      throw error
    }
  },
  
  updateMe: async (userData: Partial<User>): Promise<User> => {
    const { data } = await api.put('/api/users/me', userData)
    return data
  },
  
  updateHourlyRate: async (hourlyRate: number): Promise<User> => {
    const { data } = await api.put(`/api/users/me/hourly-rate?hourly_rate=${hourlyRate}`)
    return data
  },
}

// 勤怠API
export const attendanceApi = {
  clockIn: async (userId: number, time?: string): Promise<Attendance> => {
    const { data } = await api.post('/api/attendance/clock-in', {
      user_id: userId,
      time,
    })
    return data
  },
  
  clockOut: async (userId: number, time?: string): Promise<Attendance> => {
    const { data } = await api.post('/api/attendance/clock-out', {
      user_id: userId,
      time,
    })
    return data
  },
  
  getToday: async (userId: number = 1): Promise<AttendanceWithBreaks | null> => {
    const { data } = await api.get(`/api/attendance/today?user_id=${userId}`)
    return data
  },
  
  getList: async (params: {
    userId?: number
    year?: number
    month?: number
    skip?: number
    limit?: number
  }): Promise<AttendanceWithBreaks[]> => {
    const { data } = await api.get('/api/attendance', { params })
    return data
  },
  
  update: async (id: number, data: Partial<Attendance>): Promise<Attendance> => {
    const { data: result } = await api.put(`/api/attendance/${id}`, data)
    return result
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/attendance/${id}`)
  },
}

// 休憩API
export const breakApi = {
  start: async (attendanceId: number, time?: string): Promise<BreakTime> => {
    const { data } = await api.post('/api/breaks/start', {
      attendance_id: attendanceId,
      time,
    })
    return data
  },
  
  end: async (breakId: number, time?: string): Promise<BreakTime> => {
    const { data } = await api.post('/api/breaks/end', {
      break_id: breakId,
      time,
    })
    return data
  },
  
  getByAttendance: async (attendanceId: number): Promise<BreakTime[]> => {
    const { data } = await api.get(`/api/breaks/${attendanceId}`)
    return data
  },
  
  update: async (id: number, data: Partial<BreakTime>): Promise<BreakTime> => {
    const { data: result } = await api.put(`/api/breaks/${id}`, data)
    return result
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/breaks/${id}`)
  },
}

// レポートAPI
export const reportApi = {
  getMonthly: async (userId: number, year: number, month: number): Promise<MonthlyReport> => {
    const { data } = await api.get('/api/reports/monthly', {
      params: { user_id: userId, year, month },
    })
    return data
  },
  
  getYearly: async (userId: number, year: number): Promise<YearlyReport> => {
    const { data } = await api.get('/api/reports/yearly', {
      params: { user_id: userId, year },
    })
    return data
  },
}