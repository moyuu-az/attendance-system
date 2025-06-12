'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateAttendanceDialogProps {
  selectedDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    user_id: number;
    date: string;
    clock_in?: string;
    clock_out?: string;
  }) => Promise<void>;
}

interface BreakTimeEdit {
  start_time: string;
  end_time: string;
  duration?: number;
}

export function CreateAttendanceDialog({
  selectedDate,
  open,
  onOpenChange,
  onSave,
}: CreateAttendanceDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clock_in: '',
    clock_out: '',
  });
  const [breakTimes, setBreakTimes] = useState<BreakTimeEdit[]>([]);

  useEffect(() => {
    // ダイアログが開かれるたびにフォームデータをリセット
    if (open) {
      setFormData({
        clock_in: '',
        clock_out: '',
      });
      setBreakTimes([]);
    }
  }, [open]);

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
      // 新規勤怠記録作成データを準備
      const createData = {
        user_id: 1, // デフォルトユーザー ID
        date: selectedDate,
        clock_in: formData.clock_in || undefined,
        clock_out: formData.clock_out || undefined,
      };

      await onSave(createData);
      
      toast({
        title: '作成完了',
        description: '勤怠記録を作成しました',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Create attendance error:', error);
      toast({
        title: 'エラー',
        description: '作成に失敗しました',
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
              {format(new Date(selectedDate), 'yyyy年M月d日 (E)', { locale: ja })} の勤怠記録作成
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
                  placeholder="例: 09:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clock_out">退勤時刻</Label>
                <Input
                  id="clock_out"
                  type="time"
                  value={formData.clock_out}
                  onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
                  placeholder="例: 18:00"
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
                  休憩時間はありません
                </p>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              ※ 出勤時刻・退勤時刻は任意入力です。空欄の場合は記録なしとして作成されます。
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '作成中...' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}