'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Clock, Calendar, Coffee, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AttendanceWithBreaks } from '@/types';

interface AttendanceCardProps {
  attendance: AttendanceWithBreaks;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  showDate?: boolean;
}

export function AttendanceCard({ attendance, onEdit, onDelete, showActions = false, showDate = true }: AttendanceCardProps) {
  const isWeekend = new Date(attendance.date).getDay() === 0 || new Date(attendance.date).getDay() === 6;
  const totalBreakTime = attendance.break_times?.reduce((sum, breakTime) => sum + (breakTime.duration || 0), 0) || 0;
  const breakHours = Math.floor(totalBreakTime / 60);
  const breakMinutes = totalBreakTime % 60;

  return (
    <Card className={`transition-all hover:shadow-md ${isWeekend ? 'bg-muted/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            {/* 日付と曜日 */}
            {showDate && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(attendance.date), 'M月d日 (E)', { locale: ja })}
                  </span>
                  {isWeekend && (
                    <Badge variant="secondary" className="ml-2">
                      週末
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* 勤務時間情報 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 出勤・退勤時刻 */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {attendance.clock_in ? format(new Date(`2000-01-01T${attendance.clock_in}`), 'HH:mm') : '--:--'}
                  {' - '}
                  {attendance.clock_out ? format(new Date(`2000-01-01T${attendance.clock_out}`), 'HH:mm') : '--:--'}
                </span>
              </div>
              
              {/* 休憩時間 */}
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  休憩: {breakHours > 0 ? `${breakHours}時間` : ''}{breakMinutes > 0 ? `${breakMinutes}分` : ''}
                  {totalBreakTime === 0 && 'なし'}
                </span>
              </div>
              
              {/* 勤務時間 */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  勤務: {attendance.total_hours || 0}時間
                </span>
              </div>
              
              {/* 給与 */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  ¥{(attendance.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* 休憩時間の詳細 */}
            {attendance.break_times && attendance.break_times.length > 0 && (
              <div className="mt-2 pl-6">
                <div className="text-xs text-muted-foreground space-y-1">
                  {attendance.break_times.map((breakTime, index) => (
                    <div key={breakTime.id}>
                      休憩{index + 1}: {breakTime.start_time ? format(new Date(`2000-01-01T${breakTime.start_time}`), 'HH:mm') : '--:--'}
                      {' - '}
                      {breakTime.end_time ? format(new Date(`2000-01-01T${breakTime.end_time}`), 'HH:mm') : '--:--'}
                      {' ('}
                      {breakTime.duration}分
                      {')'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* アクションボタン */}
          {showActions && (
            <div className="flex gap-2 ml-4">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  className="h-8 w-8"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}