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
  hourly_rate?: number
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

export interface CalendarDay {
  date: string
  day_of_week: number
  is_weekend: boolean
  is_holiday: boolean
  attendance: AttendanceWithBreaks | null
  status: 'present' | 'absent' | 'weekend' | 'holiday'
}

export interface MonthlyCalendar {
  year: number
  month: number
  calendar_days: CalendarDay[]
  total_working_days: number
  total_present_days: number
  attendance_rate: number
  total_hours: number
  total_amount: number
}