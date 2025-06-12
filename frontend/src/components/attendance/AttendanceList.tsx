'use client';

import { useState } from 'react';
import { AttendanceCard } from './AttendanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatJST, getCurrentMonthJST } from '@/lib/timezone';
import { EditAttendanceDialog } from '@/components/forms/EditAttendanceDialog';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useAttendance } from '@/hooks/useAttendance';
import { AttendanceWithBreaks } from '@/types';

interface AttendanceListProps {
  selectedMonth: {
    year: number;
    month: number;
  };
  onMonthChange: (month: { year: number; month: number }) => void;
  isLoading?: boolean;
}

export function AttendanceList({ selectedMonth, onMonthChange, isLoading }: AttendanceListProps) {
  const [editingAttendance, setEditingAttendance] = useState<AttendanceWithBreaks | null>(null);
  const [deletingAttendance, setDeletingAttendance] = useState<AttendanceWithBreaks | null>(null);

  const { attendanceList, updateAttendance, deleteAttendance } = useAttendance({
    year: selectedMonth.year,
    month: selectedMonth.month,
  });

  const currentYear = getCurrentMonthJST().year;
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedMonth.year, selectedMonth.month - 2);
    onMonthChange({
      year: newDate.getFullYear(),
      month: newDate.getMonth() + 1,
    });
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth.year, selectedMonth.month);
    onMonthChange({
      year: newDate.getFullYear(),
      month: newDate.getMonth() + 1,
    });
  };

  const handleUpdate = async (data: Partial<AttendanceWithBreaks>) => {
    if (!editingAttendance) return;
    
    await updateAttendance.mutateAsync({
      id: editingAttendance.id,
      data,
    });
    setEditingAttendance(null);
  };

  const handleDelete = async () => {
    if (!deletingAttendance) return;
    
    await deleteAttendance.mutateAsync(deletingAttendance.id);
    setDeletingAttendance(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>勤怠記録</CardTitle>
            
            {/* 月選択コントロール */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2">
                <Select
                  value={selectedMonth.year.toString()}
                  onValueChange={(value) => {
                    onMonthChange({
                      ...selectedMonth,
                      year: parseInt(value),
                    });
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={selectedMonth.month.toString()}
                  onValueChange={(value) => {
                    onMonthChange({
                      ...selectedMonth,
                      month: parseInt(value),
                    });
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {month}月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : attendanceList && attendanceList.length > 0 ? (
            <div className="space-y-4">
              {attendanceList.map((attendance) => (
                <AttendanceCard
                  key={attendance.id}
                  attendance={attendance}
                  onEdit={() => setEditingAttendance(attendance)}
                  onDelete={() => setDeletingAttendance(attendance)}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {selectedMonth.year}年{selectedMonth.month}月の勤怠記録はありません
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 編集ダイアログ */}
      {editingAttendance && (
        <EditAttendanceDialog
          attendance={editingAttendance}
          open={!!editingAttendance}
          onOpenChange={(open) => !open && setEditingAttendance(null)}
          onSave={handleUpdate}
          onDelete={async () => {
            if (editingAttendance) {
              await deleteAttendance.mutateAsync(editingAttendance.id);
              setEditingAttendance(null);
            }
          }}
        />
      )}
      
      {/* 削除確認ダイアログ */}
      {deletingAttendance && (
        <DeleteConfirmDialog
          open={!!deletingAttendance}
          onOpenChange={(open) => !open && setDeletingAttendance(null)}
          onConfirm={handleDelete}
          title="勤怠記録を削除"
          description={`${formatJST(deletingAttendance.date, 'yyyy年M月d日')}の勤怠記録を削除してもよろしいですか？`}
        />
      )}
    </>
  );
}