'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AttendanceWithBreaks } from '@/types';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditAttendanceDialogProps {
  attendance: AttendanceWithBreaks | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<AttendanceWithBreaks>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

interface BreakTimeEdit {
  id?: number;
  start_time: string;
  end_time: string;
  duration?: number;
}

export function EditAttendanceDialog({
  attendance,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: EditAttendanceDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clock_in: '',
    clock_out: '',
  });
  const [breakTimes, setBreakTimes] = useState<BreakTimeEdit[]>([]);

  // attendanceがnullの場合はダイアログを表示しない
  if (!attendance) {
    return null;
  }

  useEffect(() => {
    // 勤怠データが変更されたら、フォームデータをリセット
    if (attendance) {
      setFormData({
        clock_in: attendance.clock_in || '',
        clock_out: attendance.clock_out || '',
      });
      
      // 休憩時間データを設定
      if (attendance.break_times && attendance.break_times.length > 0) {
        setBreakTimes(
          attendance.break_times.map((bt) => ({
            id: bt.id,
            start_time: bt.start_time || '',
            end_time: bt.end_time || '',
            duration: bt.duration,
          }))
        );
      } else {
        setBreakTimes([]);
      }
    }
  }, [attendance]);

  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    
    // 終了時刻が開始時刻より前の場合（日をまたぐ場合）は、翌日として計算
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // 分単位
  };

  const handleBreakTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newBreakTimes = [...breakTimes];
    newBreakTimes[index][field] = value;
    
    // 開始時刻と終了時刻が両方入力されたら、duration を計算
    if (newBreakTimes[index].start_time && newBreakTimes[index].end_time) {
      newBreakTimes[index].duration = calculateDuration(
        newBreakTimes[index].start_time,
        newBreakTimes[index].end_time
      );
    }
    
    setBreakTimes(newBreakTimes);
  };

  const addBreakTime = () => {
    setBreakTimes([...breakTimes, { start_time: '', end_time: '', duration: 0 }]);
  };

  const removeBreakTime = (index: number) => {
    setBreakTimes(breakTimes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 労働時間の計算
      let totalHours = 0;
      if (formData.clock_in && formData.clock_out) {
        const workMinutes = calculateDuration(formData.clock_in, formData.clock_out);
        const breakMinutes = breakTimes.reduce((sum, bt) => sum + (bt.duration || 0), 0);
        totalHours = Math.round((workMinutes - breakMinutes) / 60 * 10) / 10; // 小数点1桁
      }

      // 休憩時間データを適切な形式に変換
      const formattedBreakTimes = breakTimes
        .filter(bt => bt.start_time && bt.end_time) // 有効な休憩時間のみ
        .map((bt, index) => ({
          id: bt.id || Date.now() + index, // 新規の場合は一時的なIDを生成
          attendance_id: attendance?.id || 0,
          start_time: bt.start_time,
          end_time: bt.end_time || '',
          duration: bt.duration || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

      await onSave({
        ...formData,
        break_times: formattedBreakTimes,
        total_hours: totalHours,
      });

      toast({
        title: '更新完了',
        description: '勤怠情報を更新しました',
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'エラー',
        description: '更新に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !attendance) return;
    
    setIsSubmitting(true);
    try {
      await onDelete();
      toast({
        title: '削除完了',
        description: '勤怠情報を削除しました',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'エラー',
        description: '削除に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {attendance ? format(new Date(attendance.date), 'yyyy年M月d日 (E)', { locale: ja }) : '勤怠'} の勤怠編集
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 出勤・退勤時刻 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clock_in">出勤時刻</Label>
                <Input
                  id="clock_in"
                  type="time"
                  value={formData.clock_in}
                  onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clock_out">退勤時刻</Label>
                <Input
                  id="clock_out"
                  type="time"
                  value={formData.clock_out}
                  onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
                />
              </div>
            </div>

            {/* 休憩時間 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>休憩時間</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBreakTime}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  休憩追加
                </Button>
              </div>

              {breakTimes.map((breakTime, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <Input
                      type="time"
                      placeholder="開始時刻"
                      value={breakTime.start_time}
                      onChange={(e) => handleBreakTimeChange(index, 'start_time', e.target.value)}
                    />
                    <Input
                      type="time"
                      placeholder="終了時刻"
                      value={breakTime.end_time}
                      onChange={(e) => handleBreakTimeChange(index, 'end_time', e.target.value)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground w-20">
                    {breakTime.duration ? `${breakTime.duration}分` : '-'}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBreakTime(index)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {breakTimes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  休憩時間が登録されていません
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}