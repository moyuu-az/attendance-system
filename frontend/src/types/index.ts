export interface User {
  id: number
  name: string
  email: string
  hourly_rate: number
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: number
  user_id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  total_hours: number
  total_amount: number
  created_at: string
  updated_at: string
}

export interface AttendanceWithBreaks extends Attendance {
  break_times: BreakTime[]
}

export interface BreakTime {
  id: number
  attendance_id: number
  start_time: string
  end_time: string | null
  duration: number
  created_at: string
  updated_at: string
}

export interface MonthlyReport {
  year: number
  month: number
  total_days: number
  total_hours: number
  total_amount: number
  average_daily_hours: number
  attendance_list: AttendanceWithBreaks[]
}

export interface YearlyReport {
  year: number
  total_days: number
  total_hours: number
  total_amount: number
  monthly_summary: {
    month: number
    total_days: number
    total_hours: number
    total_amount: number
    average_daily_hours: number
  }[]
}